"""
Automotive Pricing & Tax Calculation Engine (Vietnam Market) - Backend Python Service
Follows Separation of Concerns (SoC) - Pure business logic matching the frontend pricingEngine.
"""

from typing import Optional, Dict, Any

DEFAULT_USD_TO_VND_RATE = 25400
DEFAULT_PRICE_MULTIPLIER = 2.54

def get_car_tax_rates(
    engine_hp: Optional[int] = None,
    fuel_type: Optional[str] = None
) -> Dict[str, float]:
    """
    Returns import duty, special consumption tax (TTĐB), VAT, and dealer margin rates.
    """
    fuel = (fuel_type or "").lower()
    hp = engine_hp or 0
    is_ev = "electric" in fuel or "điện" in fuel or "ev" in fuel
    is_hybrid = "hybrid" in fuel

    # 1. Thuế Nhập Khẩu (Import Duty)
    import_duty_rate = 0.25 if is_ev else 0.50

    # 2. Thuế Tiêu Thụ Đặc Biệt (Excise Tax)
    if is_ev:
        excise_tax_rate = 0.05
    elif is_hybrid:
        excise_tax_rate = 0.30
    elif hp > 0:
        if hp < 160:
            excise_tax_rate = 0.35
        elif hp <= 220:
            excise_tax_rate = 0.40
        elif hp <= 300:
            excise_tax_rate = 0.55
        elif hp <= 420:
            excise_tax_rate = 0.90
        else:
            excise_tax_rate = 1.10
    else:
        excise_tax_rate = 0.40

    # 3. VAT (10%)
    vat_rate = 0.10

    # 4. Dealer Margin (10%)
    dealer_margin_rate = 0.10

    return {
        "import_duty_rate": import_duty_rate,
        "excise_tax_rate": excise_tax_rate,
        "vat_rate": vat_rate,
        "dealer_margin_rate": dealer_margin_rate,
    }

def calculate_car_price_vnd(
    price_usd: Optional[int],
    engine_hp: Optional[int] = None,
    fuel_type: Optional[str] = None,
    rate: int = DEFAULT_USD_TO_VND_RATE
) -> int:
    """
    Converts raw USD MSRP to realistic Vietnam Showroom Listed Price in VND.
    """
    if not price_usd or price_usd <= 0:
        return 0

    rates = get_car_tax_rates(engine_hp, fuel_type)
    base_cif_vnd = price_usd * rate

    price_after_import = base_cif_vnd * (1 + rates["import_duty_rate"])
    price_after_excise = price_after_import * (1 + rates["excise_tax_rate"])
    price_after_vat = price_after_excise * (1 + rates["vat_rate"])
    listed_price_vnd = price_after_vat * (1 + rates["dealer_margin_rate"])

    return round(listed_price_vnd)

def vnd_to_raw_usd(
    price_vnd: Optional[int],
    engine_hp: Optional[int] = None,
    fuel_type: Optional[str] = None,
    rate: int = DEFAULT_USD_TO_VND_RATE
) -> int:
    """
    Inverse conversion: Converts Vietnam Showroom Listed Price (VND) back to raw USD MSRP in DB.
    """
    if not price_vnd or price_vnd <= 0:
        return 0

    rates = get_car_tax_rates(engine_hp, fuel_type)
    multiplier = (
        (1 + rates["import_duty_rate"])
        * (1 + rates["excise_tax_rate"])
        * (1 + rates["vat_rate"])
        * (1 + rates["dealer_margin_rate"])
    )
    return round(price_vnd / (rate * multiplier))

def format_vnd_str(amount_vnd: int) -> str:
    """
    Formats VND integer to human-readable Vietnamese string (e.g. 1.93 tỷ VNĐ, 850 triệu VNĐ).
    """
    if not amount_vnd or amount_vnd <= 0:
        return "Liên hệ giá"

    if amount_vnd >= 1_000_000_000:
        val = amount_vnd / 1_000_000_000
        val_str = f"{val:.2f}".rstrip("0").rstrip(".")
        return f"{val_str} tỷ VNĐ"
    elif amount_vnd >= 1_000_000:
        val = amount_vnd / 1_000_000
        return f"{val:.0f} triệu VNĐ"
    else:
        return f"{amount_vnd:,} VNĐ"
