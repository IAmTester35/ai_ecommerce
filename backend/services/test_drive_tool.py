import re
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import asyncio
from contextvars import ContextVar

from core.dependencies import supabase

logger = logging.getLogger(__name__)

# Context lưu session auth user_id và profile được set an toàn từ JWT Token của request
current_user_id_ctx: ContextVar[Optional[str]] = ContextVar("current_user_id_ctx", default=None)
current_user_profile_ctx: ContextVar[Optional[Dict[str, Any]]] = ContextVar("current_user_profile_ctx", default=None)

def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError):
        return False

async def book_test_drive(
    car_id_or_name: str,
    scheduled_date: str,
    customer_phone: Optional[str] = None,
    customer_name: Optional[str] = None,
    notes: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Công cụ đặt lịch hẹn lái thử xe ô tô tại showroom của AutoMatch AI.
    
    Args:
        car_id_or_name: Mã UUID của xe hoặc Tên dòng xe khách muốn lái thử (ví dụ: '1d3e3cd5-...' hoặc 'Toyota Camry 2017').
        scheduled_date: Ngày và giờ hẹn lái thử (định dạng ISO 8601, ví dụ: '2026-10-31T09:00:00' hoặc mô tả ngày giờ cụ thể).
        customer_phone: Số điện thoại liên hệ của khách hàng (nếu tài khoản đã đăng nhập, hệ thống tự lấy từ profile).
        customer_name: Tên của khách hàng (nếu có).
        notes: Yêu cầu đặc biệt hoặc ghi chú từ khách hàng.
        user_id: Mã ID người dùng trong hệ thống (tự động điền nếu đã đăng nhập).

    Returns:
        dict: Kết quả đặt lịch gồm mã lịch hẹn, thông tin xe, tên & địa chỉ showroom, thời gian xác nhận.
    """
    ctx_uid = current_user_id_ctx.get()
    ctx_prof = current_user_profile_ctx.get() or {}

    effective_user_id = user_id if (user_id and is_valid_uuid(user_id)) else ctx_uid
    effective_phone = customer_phone or ctx_prof.get("phone") or ""
    effective_name = customer_name or ctx_prof.get("full_name") or "Quý khách"

    logger.info(f"🚗 [Tool: book_test_drive] user_id='{effective_user_id}', car='{car_id_or_name}', date='{scheduled_date}', phone='{effective_phone}'")

    # 1. Kiểm tra số điện thoại bắt buộc
    clean_phone = re.sub(r"[^\d+]", "", effective_phone)
    if not clean_phone or len(clean_phone) < 9:
        return {
            "status": "error",
            "code": "MISSING_PHONE",
            "message": "Quý khách vui lòng cung cấp số điện thoại hợp lệ (từ 10 số) để Showroom liên hệ xác nhận lịch lái thử."
        }

    # 2. Tìm kiếm xe trong kho dữ liệu Supabase
    car_record = None
    try:
        if is_valid_uuid(car_id_or_name):
            # Tra cứu chính xác theo UUID
            res = await asyncio.to_thread(
                supabase.table("cars")
                .select("id, make, model, year, showroom_id, showrooms(name, address, city, phone)")
                .eq("id", car_id_or_name)
                .limit(1)
                .execute
            )
            if res.data:
                car_record = res.data[0]
        else:
            # Tra cứu thông minh: tách từ khóa tên xe, hãng xe và năm sản xuất
            words = car_id_or_name.strip().split()
            target_year = None
            text_terms = []
            for w in words:
                if w.isdigit() and len(w) == 4:
                    target_year = int(w)
                else:
                    text_terms.append(w)

            query = supabase.table("cars").select("id, make, model, year, showroom_id, showrooms(name, address, city, phone)")
            if target_year:
                query = query.eq("year", target_year)
            for term in text_terms:
                query = query.or_(f"model.ilike.%{term}%,make.ilike.%{term}%")

            res = await asyncio.to_thread(query.limit(1).execute)
            if res.data:
                car_record = res.data[0]
            else:
                # Fallback: tìm theo chuỗi đầy đủ
                res_fallback = await asyncio.to_thread(
                    supabase.table("cars")
                    .select("id, make, model, year, showroom_id, showrooms(name, address, city, phone)")
                    .or_(f"model.ilike.%{car_id_or_name}%,make.ilike.%{car_id_or_name}%")
                    .limit(1)
                    .execute
                )
                if res_fallback.data:
                    car_record = res_fallback.data[0]
    except Exception as e:
        logger.error(f"Error querying car for test drive: {e}")
        return {
            "status": "error",
            "code": "DATABASE_ERROR",
            "message": "Không thể kiểm tra thông tin xe lúc này. Vui lòng thử lại sau."
        }

    if not car_record:
        return {
            "status": "error",
            "code": "CAR_NOT_FOUND",
            "message": f"Không tìm thấy mẫu xe tương ứng với '{car_id_or_name}' trong kho xe hiện tại."
        }

    car_id = car_record["id"]
    car_name = f"{car_record.get('year')} {car_record.get('make')} {car_record.get('model')}"
    showroom_id = car_record.get("showroom_id")
    showroom_info = car_record.get("showrooms") or {}

    # 3. Chuẩn hóa ngày giờ hẹn
    normalized_date = scheduled_date
    try:
        # Nếu đã là định dạng ISO chuẩn
        dt = datetime.fromisoformat(scheduled_date.replace("Z", "+00:00"))
        normalized_date = dt.isoformat()
    except Exception:
        # Giữ nguyên chuỗi ngày nếu model truyền ISO tương đối
        pass

    # 4. Ghép nội dung ghi chú
    notes_parts = []
    if customer_name:
        notes_parts.append(f"Khách hàng: {customer_name.strip()}")
    notes_parts.append(f"SĐT: {clean_phone}")
    if notes:
        notes_parts.append(f"Ghi chú: {notes.strip()}")
    notes_parts.append("Nguồn: Trợ lý ảo AI Chat")
    full_notes = " | ".join(notes_parts)

    # 5. Lưu vào bảng test_drives trên Supabase
    record_payload = {
        "car_id": car_id,
        "showroom_id": showroom_id,
        "scheduled_date": normalized_date,
        "status": "pending",
        "notes": full_notes
    }
    if effective_user_id and is_valid_uuid(effective_user_id):
        record_payload["user_id"] = effective_user_id

    try:
        insert_res = await asyncio.to_thread(
            supabase.table("test_drives")
            .insert(record_payload)
            .select("id, status, scheduled_date")
            .execute
        )
        if not insert_res.data:
            raise RuntimeError("Insert returned empty data")
        
        booking_data = insert_res.data[0]
        booking_id = booking_data.get("id")

        logger.info(f"✅ [Tool: book_test_drive] Success! Booking ID: {booking_id}")
        return {
            "status": "success",
            "booking_id": booking_id,
            "car_name": car_name,
            "showroom_name": showroom_info.get("name", "AutoMatch Showroom Flagship"),
            "showroom_address": showroom_info.get("address", "Liên hệ hotline để nhận địa chỉ showroom gần nhất"),
            "showroom_phone": showroom_info.get("phone", "1900 6868"),
            "scheduled_date": normalized_date,
            "customer_phone": clean_phone,
            "customer_name": customer_name or "Quý khách",
            "message": f"Đặt lịch lái thử thành công cho xe {car_name}."
        }

    except Exception as e:
        logger.error(f"Failed to insert test drive: {e}", exc_info=True)
        return {
            "status": "error",
            "code": "INSERT_FAILED",
            "message": "Hệ thống gặp sự cố khi lưu lịch hẹn. Quý khách vui lòng thử lại sau giây lát."
        }

async def get_available_showrooms() -> Dict[str, Any]:
    """
    Lấy danh sách các showroom đang hoạt động của AutoMatch để người dùng lựa chọn địa điểm lái thử.
    """
    try:
        res = await asyncio.to_thread(
            supabase.table("showrooms")
            .select("id, name, address, city, phone, opening_hours")
            .eq("is_active", True)
            .execute
        )
        return {
            "status": "success",
            "showrooms": res.data or []
        }
    except Exception as e:
        logger.error(f"Failed to fetch showrooms: {e}")
        return {
            "status": "error",
            "showrooms": []
        }


async def lookup_test_drives(
    customer_phone: Optional[str] = None,
    booking_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Tra cứu danh sách lịch hẹn lái thử xe của khách hàng.
    
    Args:
        customer_phone: Số điện thoại người đặt lịch (dành cho khách vãng lai).
        booking_id: Mã lịch hẹn UUID nếu khách có mã cụ thể.
        user_id: ID người dùng nếu đã đăng nhập (hệ thống tự điền nếu có phiên).

    Returns:
        dict: Danh sách các lịch hẹn kèm trạng thái, thông tin xe và địa chỉ showroom.
    """
    ctx_uid = current_user_id_ctx.get()
    effective_user_id = user_id if (user_id and is_valid_uuid(user_id)) else ctx_uid

    logger.info(f"🔎 [Tool: lookup_test_drives] user_id='{effective_user_id}', phone='{customer_phone}', booking_id='{booking_id}'")

    if not customer_phone and not booking_id and not effective_user_id:
        return {
            "status": "error",
            "code": "MISSING_IDENTIFIER",
            "message": "Quý khách vui lòng cung cấp Số điện thoại hoặc Mã lịch hẹn để em tra cứu thông tin."
        }

    try:
        query = supabase.table("test_drives").select(
            "id, scheduled_date, status, notes, created_at, user_id, "
            "car:cars(make, model, year), "
            "showroom:showrooms(name, address, city, phone)"
        )

        # Ưu tiên 1: Tra cứu chính xác theo UUID mã lịch hẹn
        if booking_id and is_valid_uuid(booking_id):
            query = query.eq("id", booking_id)
        # Ưu tiên 2: Tra cứu chính xác theo user_id tài khoản đã đăng nhập (Chuẩn RDBMS)
        elif effective_user_id and is_valid_uuid(effective_user_id):
            query = query.eq("user_id", effective_user_id)
        # Ưu tiên 3: Tra cứu theo SĐT cho khách vãng lai
        elif customer_phone:
            clean_phone = re.sub(r"[^\d+]", "", customer_phone)
            query = query.ilike("notes", f"%{clean_phone}%")

        res = await asyncio.to_thread(query.order("created_at", desc=True).limit(5).execute)
        records = res.data or []

        if not records:
            return {
                "status": "not_found",
                "message": "Không tìm thấy lịch hẹn lái thử nào khớp với thông tin đã cung cấp."
            }

        appointments = []
        for r in records:
            car = r.get("car") or {}
            showroom = r.get("showroom") or {}
            car_title = f"{car.get('year', '')} {car.get('make', '')} {car.get('model', '')}".strip() or "Xe lái thử"
            appointments.append({
                "booking_id": r["id"],
                "car": car_title,
                "showroom_name": showroom.get("name", "AutoMatch Showroom"),
                "showroom_address": showroom.get("address", ""),
                "showroom_phone": showroom.get("phone", "1900 6868"),
                "scheduled_date": r["scheduled_date"],
                "status": r["status"],
                "notes": r.get("notes", "")
            })

        return {
            "status": "success",
            "total": len(appointments),
            "appointments": appointments
        }

    except Exception as e:
        logger.error(f"Error looking up test drives: {e}", exc_info=True)
        return {
            "status": "error",
            "code": "LOOKUP_FAILED",
            "message": "Hệ thống gặp sự cố khi tra cứu lịch hẹn. Vui lòng thử lại sau."
        }

async def cancel_test_drive(
    booking_id: Optional[str] = None,
    customer_phone: Optional[str] = None,
    reason: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Hủy lịch hẹn lái thử xe của khách hàng.
    
    Args:
        booking_id: Mã lịch hẹn UUID cần hủy.
        customer_phone: Số điện thoại đặt lịch (dành cho khách vãng lai).
        reason: Lý do khách hàng muốn hủy lịch (ví dụ: bận việc đột xuất, đổi kế hoạch).
        user_id: ID người dùng nếu đã đăng nhập (hệ thống tự lấy nếu có phiên).

    Returns:
        dict: Kết quả xác nhận hủy lịch hẹn.
    """
    ctx_uid = current_user_id_ctx.get()
    effective_user_id = user_id if (user_id and is_valid_uuid(user_id)) else ctx_uid

    logger.info(f"❌ [Tool: cancel_test_drive] user_id='{effective_user_id}', booking_id='{booking_id}', phone='{customer_phone}', reason='{reason}'")

    if not booking_id and not customer_phone and not effective_user_id:
        return {
            "status": "error",
            "code": "MISSING_INFO",
            "message": "Quý khách vui lòng cung cấp Mã lịch hẹn hoặc Số điện thoại đặt lịch để thực hiện hủy."
        }

    try:
        # Tìm bản ghi hợp lệ
        query = supabase.table("test_drives").select(
            "id, scheduled_date, status, notes, user_id, "
            "car:cars(make, model, year), "
            "showroom:showrooms(name, address)"
        )

        if booking_id and is_valid_uuid(booking_id):
            query = query.eq("id", booking_id)
        elif effective_user_id and is_valid_uuid(effective_user_id):
            # Khóa ngoại user_id tài khoản đăng nhập
            query = query.eq("user_id", effective_user_id).in_("status", ["pending", "confirmed"])
        elif customer_phone:
            clean_phone = re.sub(r"[^\d+]", "", customer_phone)
            query = query.ilike("notes", f"%{clean_phone}%").in_("status", ["pending", "confirmed"])

        res = await asyncio.to_thread(query.order("created_at", desc=True).limit(1).execute)
        if not res.data:
            return {
                "status": "not_found",
                "message": "Không tìm thấy lịch hẹn còn hiệu lực nào để hủy."
            }

        target = res.data[0]
        if target["status"] == "cancelled":
            return {
                "status": "already_cancelled",
                "message": "Lịch hẹn này đã được hủy trước đó rồi ạ."
            }
        if target["status"] == "completed":
            return {
                "status": "already_completed",
                "message": "Buổi lái thử này đã hoàn tất, không thể thực hiện thao tác hủy."
            }

        # Cập nhật status thành 'cancelled'
        old_notes = target.get("notes") or ""
        reason_text = f" | [Hủy bởi khách: {reason.strip()}]" if reason else " | [Khách yêu cầu hủy qua AI Chat]"
        updated_notes = old_notes + reason_text

        update_res = await asyncio.to_thread(
            supabase.table("test_drives")
            .update({"status": "cancelled", "notes": updated_notes})
            .eq("id", target["id"])
            .select("id, status")
            .execute
        )

        car = target.get("car") or {}
        car_name = f"{car.get('year', '')} {car.get('make', '')} {car.get('model', '')}".strip() or "Xe lái thử"

        logger.info(f"✅ [Tool: cancel_test_drive] Cancelled booking {target['id']} successfully.")
        return {
            "status": "success",
            "booking_id": target["id"],
            "car_name": car_name,
            "scheduled_date": target["scheduled_date"],
            "message": f"Đã hủy thành công lịch hẹn lái thử xe {car_name} lúc {target['scheduled_date']}."
        }

    except Exception as e:
        logger.error(f"Error cancelling test drive: {e}", exc_info=True)
        return {
            "status": "error",
            "code": "CANCEL_FAILED",
            "message": "Gặp lỗi khi hủy lịch hẹn. Quý khách vui lòng thử lại sau."
        }

async def reschedule_test_drive(
    new_scheduled_date: str,
    booking_id: Optional[str] = None,
    customer_phone: Optional[str] = None,
    notes: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Thay đổi ngày hoặc giờ hẹn lái thử xe cho lịch hẹn đã đặt.
    
    Args:
        new_scheduled_date: Ngày và giờ mới muốn đổi (ví dụ: '2026-11-03T14:00:00' hoặc mô tả cụ thể).
        booking_id: Mã lịch hẹn UUID cần đổi giờ.
        customer_phone: Số điện thoại đặt lịch (dành cho khách vãng lai).
        notes: Ghi chú lý do đổi giờ hoặc yêu cầu bổ sung.
        user_id: ID người dùng nếu đã đăng nhập (hệ thống tự lấy nếu có phiên).

    Returns:
        dict: Kết quả xác nhận thay đổi lịch hẹn.
    """
    ctx_uid = current_user_id_ctx.get()
    effective_user_id = user_id if (user_id and is_valid_uuid(user_id)) else ctx_uid

    logger.info(f"🔄 [Tool: reschedule_test_drive] user_id='{effective_user_id}', new_date='{new_scheduled_date}', booking_id='{booking_id}', phone='{customer_phone}'")

    if not new_scheduled_date:
        return {
            "status": "error",
            "code": "MISSING_DATE",
            "message": "Quý khách vui lòng cung cấp thời gian mới muốn đổi lịch hẹn."
        }

    if not booking_id and not customer_phone and not effective_user_id:
        return {
            "status": "error",
            "code": "MISSING_INFO",
            "message": "Quý khách vui lòng cung cấp Mã lịch hẹn hoặc Số điện thoại để em dời lịch."
        }

    try:
        # Chuẩn hóa ngày giờ mới
        clean_new_date = new_scheduled_date.strip()
        normalized_date = clean_new_date
        try:
            dt = datetime.fromisoformat(clean_new_date.replace("Z", "+00:00"))
            normalized_date = dt.isoformat()
        except Exception:
            pass

        # Tìm bản ghi hợp lệ
        query = supabase.table("test_drives").select(
            "id, scheduled_date, status, notes, user_id, "
            "car:cars(make, model, year), "
            "showroom:showrooms(name, address, phone)"
        )

        if booking_id and is_valid_uuid(booking_id):
            query = query.eq("id", booking_id)
        elif effective_user_id and is_valid_uuid(effective_user_id):
            # Khóa ngoại user_id tài khoản đăng nhập
            query = query.eq("user_id", effective_user_id).in_("status", ["pending", "confirmed"])
        elif customer_phone:
            clean_phone = re.sub(r"[^\d+]", "", customer_phone)
            query = query.ilike("notes", f"%{clean_phone}%").in_("status", ["pending", "confirmed"])
            query = query.eq("user_id", user_id).in_("status", ["pending", "confirmed"])

        res = await asyncio.to_thread(query.order("created_at", desc=True).limit(1).execute)
        if not res.data:
            return {
                "status": "not_found",
                "message": "Không tìm thấy lịch hẹn còn hiệu lực nào để dời lịch."
            }

        target = res.data[0]
        if target["status"] == "cancelled":
            return {
                "status": "already_cancelled",
                "message": "Lịch hẹn này đã bị hủy trước đó. Quý khách vui lòng đặt một lịch hẹn mới."
            }
        if target["status"] == "completed":
            return {
                "status": "already_completed",
                "message": "Buổi lái thử này đã hoàn tất, không thể dời ngày."
            }

        old_date_str = target.get("scheduled_date") or ""
        # Nếu new_scheduled_date chỉ có ngày (YYYY-MM-DD) mà không có giờ, kế thừa khung giờ cũ từ lịch hẹn
        try:
            if "T" not in clean_new_date and " " not in clean_new_date and len(clean_new_date) == 10:
                old_time_suffix = "09:00:00+07:00"
                if old_date_str:
                    try:
                        old_dt = datetime.fromisoformat(old_date_str.replace("Z", "+00:00"))
                        old_time_suffix = old_dt.strftime("%H:%M:%S%z")
                        if not old_time_suffix.endswith(("+", "-")) and len(old_time_suffix) == 8:
                            old_time_suffix += "+07:00"
                    except Exception:
                        pass
                normalized_date = f"{clean_new_date}T{old_time_suffix}"
        except Exception:
            pass

        old_notes = target.get("notes") or ""
        reschedule_tag = f" | [Dời từ {old_date_str} sang {normalized_date}]"
        if notes:
            reschedule_tag += f" [Ghi chú thêm: {notes.strip()}]"
        updated_notes = old_notes + reschedule_tag

        await asyncio.to_thread(
            supabase.table("test_drives")
            .update({
                "scheduled_date": normalized_date,
                "notes": updated_notes
            })
            .eq("id", target["id"])
            .execute
        )

        car = target.get("car") or {}
        showroom = target.get("showroom") or {}
        car_name = f"{car.get('year', '')} {car.get('make', '')} {car.get('model', '')}".strip() or "Xe lái thử"

        logger.info(f"✅ [Tool: reschedule_test_drive] Rescheduled booking {target['id']} from {old_date_str} to {normalized_date}")
        return {
            "status": "success",
            "booking_id": target["id"],
            "car_name": car_name,
            "old_date": old_date_str,
            "new_date": normalized_date,
            "showroom_name": showroom.get("name", "AutoMatch Showroom"),
            "showroom_address": showroom.get("address", ""),
            "showroom_phone": showroom.get("phone", "1900 6868"),
            "message": f"Đã dời lịch lái thử xe {car_name} thành công sang {normalized_date}."
        }

    except Exception as e:
        logger.error(f"Error rescheduling test drive: {e}", exc_info=True)
        return {
            "status": "error",
            "code": "RESCHEDULE_FAILED",
            "message": "Gặp sự cố khi dời lịch hẹn. Quý khách vui lòng thử lại sau."
        }
