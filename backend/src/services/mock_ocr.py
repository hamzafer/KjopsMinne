import random
from pathlib import Path
from typing import Any

from src.services.ocr import OCRService


class MockOCRService(OCRService):
    """Mock OCR service with Norwegian receipt fixtures."""

    FIXTURES = [
        {
            "merchant": "REMA 1000",
            "location": "Grünerløkka, Oslo",
            "date": "15.01.2025",
            "time": "14:32",
            "items": [
                ("NORDFJORD BACON 400G", 49.90),
                ("MELK LETT 1L", 21.90),
                ("FIRST PRICE BRØD", 15.90),
                ("BANANER 1KG", 24.90),
                ("PANT 1 X 2,00", 2.00),
                ("COOP COLA 1.5L", 29.90),
                ("PANT 1 X 2,50", 2.50),
                ("NORVEGIA 500G", 89.90),
                ("LEVERPOSTEI GILDE", 32.90),
                ("RABATT LEVERPOSTEI", -10.00),
            ],
            "payment": "VISA *4521",
        },
        {
            "merchant": "KIWI",
            "location": "Storo, Oslo",
            "date": "16.01.2025",
            "time": "18:45",
            "items": [
                ("KYLLINGFILET 400G", 79.90),
                ("AGURK", 19.90),
                ("TOMAT 500G", 34.90),
                ("PANT 4 X 2,00", 8.00),
                ("PEPSI MAX 4X0.5L", 59.90),
                ("FIRST PRICE RIS 1KG", 22.90),
                ("EVERGOOD KAFFE 250G", 54.90),
            ],
            "payment": "VIPPS",
        },
        {
            "merchant": "MENY",
            "location": "Majorstuen, Oslo",
            "date": "17.01.2025",
            "time": "11:20",
            "items": [
                ("ENTRECOTE 300G", 149.90),
                ("RØDVIN BAROLO", 229.00),
                ("FERSK PASTA 400G", 45.90),
                ("PARMESAN 200G", 69.90),
                ("RUCCOLA 75G", 24.90),
                ("CHERRYTOMATER", 39.90),
                ("OLIVENOLJE 500ML", 89.90),
            ],
            "payment": "MASTERCARD *8832",
        },
        {
            "merchant": "COOP EXTRA",
            "location": "Sandvika",
            "date": "18.01.2025",
            "time": "09:15",
            "items": [
                ("DOPAPIR 12PK", 89.90),
                ("ZALO ORIGINAL", 34.90),
                ("TØYMYKNER 1L", 44.90),
                ("HAVREGRYN 750G", 19.90),
                ("YOGHURT SKYR 500G", 29.90),
                ("PANT 6 X 3,00", 18.00),
                ("FARRIS 6X0.5L", 69.90),
            ],
            "payment": "KONTANT",
        },
    ]

    async def extract_text(self, image_path: Path) -> dict[str, Any]:
        """Return mock OCR data based on Norwegian receipt fixtures."""
        fixture = random.choice(self.FIXTURES)

        lines = [
            fixture["merchant"],
            fixture["location"],
            "",
            f"Dato: {fixture['date']}  Kl: {fixture['time']}",
            "-" * 40,
        ]

        total = 0
        for name, price in fixture["items"]:
            lines.append(f"{name:<30} {price:>8.2f}")
            total += price

        lines.extend([
            "-" * 40,
            f"{'TOTAL':<30} {total:>8.2f} NOK",
            "",
            f"Betalt med: {fixture['payment']}",
            "",
            "Takk for handelen!",
        ])

        return {
            "lines": lines,
            "blocks": [
                {"text": line, "confidence": 0.95 + random.random() * 0.05}
                for line in lines
                if line.strip()
            ],
            "raw": {
                "fixture_used": True,
                "merchant": fixture["merchant"],
                "items": fixture["items"],
                "date": fixture["date"],
                "time": fixture["time"],
                "payment": fixture["payment"],
            },
        }
