import sys
import logging
from typing import Optional

class ANSIColors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    
    # Standard colors
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    
    # Bright colors
    BRIGHT_BLACK = "\033[90m"
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"

class ColoredFormatter(logging.Formatter):
    """
    Formatter hỗ trợ màu sắc ANSI chuẩn cho Docker stdout.
    Giúp phân biệt rõ ràng Log Level, Request/Response và Timers.
    """
    LEVEL_COLORS = {
        logging.DEBUG: ANSIColors.BRIGHT_BLACK,
        logging.INFO: ANSIColors.BRIGHT_GREEN,
        logging.WARNING: ANSIColors.BRIGHT_YELLOW,
        logging.ERROR: ANSIColors.BRIGHT_RED,
        logging.CRITICAL: f"{ANSIColors.BOLD}{ANSIColors.RED}",
    }

    def format(self, record: logging.LogRecord) -> str:
        # Màu theo level
        lvl_color = self.LEVEL_COLORS.get(record.levelno, ANSIColors.WHITE)
        time_str = f"{ANSIColors.BRIGHT_BLACK}{self.formatTime(record, '%Y-%m-%d %H:%M:%S')}{ANSIColors.RESET}"
        level_str = f"{lvl_color}{record.levelname:<7}{ANSIColors.RESET}"
        name_str = f"{ANSIColors.BRIGHT_BLUE}{record.name}{ANSIColors.RESET}"
        
        msg = record.getMessage()
        
        # Highlight các tags đặc biệt để tăng độ trực quan
        if "➡️ [REQ]" in msg:
            msg = msg.replace("➡️ [REQ]", f"{ANSIColors.BOLD}{ANSIColors.CYAN}➡️ [REQ]{ANSIColors.RESET}")
        elif "⬅️ [RES]" in msg:
            msg = msg.replace("⬅️ [RES]", f"{ANSIColors.BOLD}{ANSIColors.GREEN}⬅️ [RES]{ANSIColors.RESET}")
        elif "❌ [ERR]" in msg:
            msg = msg.replace("❌ [ERR]", f"{ANSIColors.BOLD}{ANSIColors.RED}❌ [ERR]{ANSIColors.RESET}")
        elif "[Timer]" in msg:
            msg = msg.replace("[Timer]", f"{ANSIColors.BOLD}{ANSIColors.BRIGHT_MAGENTA}⏱️ [Timer]{ANSIColors.RESET}")
        elif "[AI Search]" in msg:
            msg = msg.replace("[AI Search]", f"{ANSIColors.BOLD}{ANSIColors.BRIGHT_CYAN}🔍 [AI Search]{ANSIColors.RESET}")
        elif "[Hybrid Search]" in msg:
            msg = msg.replace("[Hybrid Search]", f"{ANSIColors.BOLD}{ANSIColors.BRIGHT_BLUE}⚡ [Hybrid Search]{ANSIColors.RESET}")

        return f"{time_str} | {level_str} | {name_str} : {msg}"

class HealthCheckFilter(logging.Filter):
    """
    Loại bỏ log của các request health check (/health, /docs) khỏi log access để tránh spam.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        if "/health" in msg or "GET /docs" in msg:
            return False
        return True

def setup_logging(level: int = logging.INFO):
    """
    Khởi tạo hệ thống logging có màu sắc cho toàn bộ ứng dụng và uvicorn.
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColoredFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Xoá handler cũ tránh duplicate
    for h in list(root_logger.handlers):
        root_logger.removeHandler(h)
    root_logger.addHandler(handler)

    # Cấu hình uvicorn logger
    for uvicorn_log_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        u_log = logging.getLogger(uvicorn_log_name)
        u_log.handlers = [handler]
        u_log.propagate = False
        if uvicorn_log_name == "uvicorn.access":
            u_log.addFilter(HealthCheckFilter())
