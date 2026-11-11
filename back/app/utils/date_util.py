# 날짜·월 계산 — 날짜는 "YYYY-MM-DD", 월은 "YYYY-MM" 문자열로 다룬다. 기준 시간대는 한국(KST).

from datetime import date, datetime, timedelta, timezone

# 한국은 서머타임이 없어 +9시간 고정으로 충분하다.
KST = timezone(timedelta(hours=9))
FIRST_DAY = "2000-01-01"


def today_kst() -> str:
    return datetime.now(KST).strftime("%Y-%m-%d")


def is_valid_month(month: str) -> bool:
    try:
        datetime.strptime(month, "%Y-%m")
    except (TypeError, ValueError):
        return False
    return len(month) == 7


# 2000-01-01 ~ 오늘 사이의 올바른 날짜인지
def is_valid_day(day: str) -> bool:
    try:
        date.fromisoformat(day)
    except (TypeError, ValueError):
        return False
    return len(day) == 10 and FIRST_DAY <= day <= today_kst()


# "2026-11" → ("2026-11-01", "2026-12-01"). 월 조회는 occurred_on >= 시작, < 다음 달 시작 으로 한다.
def month_range(month: str) -> tuple:
    year, mon = int(month[:4]), int(month[5:7])
    next_year, next_mon = (year + 1, 1) if mon == 12 else (year, mon + 1)
    return f"{year:04d}-{mon:02d}-01", f"{next_year:04d}-{next_mon:02d}-01"


def previous_month(month: str) -> str:
    year, mon = int(month[:4]), int(month[5:7])
    prev_year, prev_mon = (year - 1, 12) if mon == 1 else (year, mon - 1)
    return f"{prev_year:04d}-{prev_mon:02d}"
