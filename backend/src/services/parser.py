import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any


@dataclass
class ParsedItem:
    raw_name: str
    canonical_name: str | None
    quantity: Decimal | None
    unit: str | None
    unit_price: Decimal | None
    total_price: Decimal
    is_pant: bool
    discount_amount: Decimal


@dataclass
class ParsedReceipt:
    merchant_name: str
    store_location: str | None
    purchase_date: datetime
    total_amount: Decimal
    currency: str
    payment_method: str | None
    items: list[ParsedItem]


# Norwegian abbreviation mappings
ABBREVIATIONS = {
    "MEL": "MELK",
    "SMR": "SMØR",
    "YOG": "YOGHURT",
    "KYL": "KYLLING",
    "BRD": "BRØD",
    "OST": "OST",
    "FRT": "FRUKT",
    "GRN": "GRØNNSAKER",
    "KJT": "KJØTT",
    "FSK": "FISK",
}

# Known merchants
MERCHANTS = [
    "REMA 1000", "KIWI", "MENY", "COOP EXTRA", "COOP PRIX", "COOP MEGA",
    "JOKER", "BUNNPRIS", "SPAR", "EUROPRIS", "NORMAL", "ELKJØP",
]


def normalize_name(name: str) -> str:
    """Normalize item name by expanding abbreviations."""
    result = name.upper().strip()
    for abbr, full in ABBREVIATIONS.items():
        result = re.sub(rf"\b{abbr}\b", full, result)
    return result


def parse_price(price_str: str) -> Decimal:
    """Parse a Norwegian price string to Decimal."""
    # Handle Norwegian comma as decimal separator
    cleaned = price_str.replace(" ", "").replace(",", ".")
    # Remove NOK/kr suffix
    cleaned = re.sub(r"(NOK|kr)$", "", cleaned, flags=re.IGNORECASE)
    try:
        return Decimal(cleaned).quantize(Decimal("0.01"))
    except Exception:
        return Decimal("0")


def parse_date(date_str: str) -> datetime:
    """Parse Norwegian date format."""
    formats = [
        "%d.%m.%Y",
        "%d.%m.%y",
        "%d/%m/%Y",
        "%d/%m/%y",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return datetime.now()


def parse_ocr_result(ocr_data: dict[str, Any]) -> ParsedReceipt:
    """Parse OCR result into structured receipt data."""
    raw = ocr_data.get("raw", {})

    # If using mock data with structured fixture
    if raw.get("fixture_used"):
        return parse_fixture_data(raw)

    # Parse from OCR lines
    lines = ocr_data.get("lines", [])
    return parse_lines(lines)


def parse_fixture_data(raw: dict[str, Any]) -> ParsedReceipt:
    """Parse mock fixture data directly."""
    items = []
    total = Decimal("0")

    for name, price in raw.get("items", []):
        price_decimal = Decimal(str(price))
        is_pant = "PANT" in name.upper()
        is_discount = price < 0 or "RABATT" in name.upper()

        items.append(ParsedItem(
            raw_name=name,
            canonical_name=normalize_name(name) if not is_pant and not is_discount else None,
            quantity=Decimal("1"),
            unit=None,
            unit_price=price_decimal if price_decimal > 0 else None,
            total_price=abs(price_decimal),
            is_pant=is_pant,
            discount_amount=abs(price_decimal) if is_discount else Decimal("0"),
        ))
        total += price_decimal

    # Parse date
    date_str = raw.get("date", "")
    purchase_date = parse_date(date_str)

    return ParsedReceipt(
        merchant_name=raw.get("merchant", "Unknown"),
        store_location=raw.get("location"),
        purchase_date=purchase_date,
        total_amount=total.quantize(Decimal("0.01")),
        currency="NOK",
        payment_method=raw.get("payment"),
        items=items,
    )


def parse_lines(lines: list[str]) -> ParsedReceipt:
    """Parse OCR text lines into receipt data."""
    merchant_name = "Unknown"
    store_location = None
    purchase_date = datetime.now()
    payment_method = None
    items: list[ParsedItem] = []

    # Patterns
    price_pattern = re.compile(r"(-?\d+[,.]?\d*)\s*(NOK|kr)?$", re.IGNORECASE)
    date_pattern = re.compile(r"(\d{1,2}[./]\d{1,2}[./]\d{2,4})")
    pant_pattern = re.compile(r"PANT.*?(\d+)\s*[xX]\s*(\d+[,.]?\d*)", re.IGNORECASE)

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        # Check for merchant
        for merchant in MERCHANTS:
            if merchant.lower() in line.lower():
                merchant_name = merchant
                # Next non-empty line might be location
                if i + 1 < len(lines) and lines[i + 1].strip():
                    store_location = lines[i + 1].strip()
                break

        # Check for date
        date_match = date_pattern.search(line)
        if date_match:
            purchase_date = parse_date(date_match.group(1))

        # Check for payment method
        if any(kw in line.upper() for kw in ["VISA", "MASTERCARD", "VIPPS", "KONTANT", "BETALT"]):
            payment_method = line.strip()

        # Check for item with price
        price_match = price_pattern.search(line)
        if price_match and "TOTAL" not in line.upper():
            price = parse_price(price_match.group(1))
            name = line[:price_match.start()].strip()

            if name and price != Decimal("0"):
                is_pant = "PANT" in name.upper()
                is_discount = price < 0 or "RABATT" in name.upper()

                # Parse pant quantity
                quantity = Decimal("1")
                pant_match = pant_pattern.search(line)
                if pant_match:
                    quantity = Decimal(pant_match.group(1))

                canonical = None
                if not is_pant and not is_discount:
                    canonical = normalize_name(name)
                items.append(ParsedItem(
                    raw_name=name,
                    canonical_name=canonical,
                    quantity=quantity,
                    unit=None,
                    unit_price=abs(price) / quantity if quantity else None,
                    total_price=abs(price),
                    is_pant=is_pant,
                    discount_amount=abs(price) if is_discount else Decimal("0"),
                ))

    # Calculate total from items
    total = sum(
        (item.total_price if not item.discount_amount else -item.discount_amount)
        for item in items
    )

    return ParsedReceipt(
        merchant_name=merchant_name,
        store_location=store_location,
        purchase_date=purchase_date,
        total_amount=total.quantize(Decimal("0.01")),
        currency="NOK",
        payment_method=payment_method,
        items=items,
    )
