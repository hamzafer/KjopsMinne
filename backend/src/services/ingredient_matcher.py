"""Ingredient matching service for mapping receipt items to canonical ingredients."""
import re
from decimal import Decimal
from difflib import SequenceMatcher
from typing import Protocol
from uuid import UUID

from pydantic import BaseModel


class IngredientLike(Protocol):
    """Protocol for objects that can be matched as ingredients."""
    id: UUID
    name: str
    canonical_name: str
    aliases: list[str]


class MatchResult(BaseModel):
    """Result of matching a raw name to a canonical ingredient."""
    ingredient_id: UUID
    ingredient_name: str
    confidence: Decimal
    method: str  # "exact" | "alias" | "fuzzy" | "llm" | "none"


class IngredientMatcher:
    """Matches receipt item names to canonical ingredients."""

    # Norwegian brand prefixes to remove
    BRAND_PREFIXES = [
        "tine", "q-", "mills", "gilde", "prior", "nordfjord",
        "first price", "eldorado", "rema", "coop", "xtra",
    ]

    # Patterns to remove from names
    REMOVE_PATTERNS = [
        r"\d+\s*[xX]\s*",          # "2x", "3X"
        r"\d+\s*(g|kg|ml|l|dl|cl)\b",  # "500g", "1L"
        r"\d+\s*(stk|pk)\b",       # "6stk", "2pk"
        r"\d+%",                    # "3.5%"
    ]

    # Norwegian character replacements for fuzzy matching
    CHAR_MAP = {
        "æ": "ae", "ø": "o", "å": "a",
        "é": "e", "è": "e", "ê": "e",
    }

    def normalize_name(self, raw_name: str) -> str:
        """Normalize a raw receipt name for matching."""
        name = raw_name.lower().strip()

        # Remove patterns (weight, quantity, etc.)
        for pattern in self.REMOVE_PATTERNS:
            name = re.sub(pattern, "", name, flags=re.IGNORECASE)

        # Remove brand prefixes
        for brand in self.BRAND_PREFIXES:
            if name.startswith(brand + " "):
                name = name[len(brand) + 1:]
                break

        # Normalize Norwegian characters
        for char, replacement in self.CHAR_MAP.items():
            name = name.replace(char, replacement)

        # Clean up whitespace
        name = " ".join(name.split())

        return name

    def match_against_ingredient(
        self, normalized_name: str, ingredient: IngredientLike
    ) -> MatchResult | None:
        """
        Try to match a normalized name against a single ingredient.

        Returns MatchResult if match found, None otherwise.
        """
        # Exact match on canonical_name
        if normalized_name == ingredient.canonical_name:
            return MatchResult(
                ingredient_id=ingredient.id,
                ingredient_name=ingredient.name,
                confidence=Decimal("1.0"),
                method="exact",
            )

        # Check aliases
        for alias in ingredient.aliases:
            alias_normalized = alias.lower()
            if normalized_name == alias_normalized:
                return MatchResult(
                    ingredient_id=ingredient.id,
                    ingredient_name=ingredient.name,
                    confidence=Decimal("0.95"),
                    method="alias",
                )

        # Fuzzy matching: check if name contains canonical or vice versa
        canonical = ingredient.canonical_name
        if canonical in normalized_name or normalized_name in canonical:
            # Substring match
            ratio = SequenceMatcher(None, normalized_name, canonical).ratio()
            if ratio > 0.5:
                return MatchResult(
                    ingredient_id=ingredient.id,
                    ingredient_name=ingredient.name,
                    confidence=Decimal(str(round(0.7 + (ratio * 0.2), 2))),
                    method="fuzzy",
                )

        # Check aliases for fuzzy
        for alias in ingredient.aliases:
            alias_lower = alias.lower()
            if alias_lower in normalized_name or normalized_name in alias_lower:
                ratio = SequenceMatcher(None, normalized_name, alias_lower).ratio()
                if ratio > 0.5:
                    return MatchResult(
                        ingredient_id=ingredient.id,
                        ingredient_name=ingredient.name,
                        confidence=Decimal(str(round(0.6 + (ratio * 0.25), 2))),
                        method="fuzzy",
                    )

        return None

    async def match(
        self,
        raw_name: str,
        ingredients: list[IngredientLike],
    ) -> MatchResult | None:
        """
        Match a raw receipt item name to the best canonical ingredient.

        Args:
            raw_name: The raw name from the receipt (e.g., "TINE MELK 1L")
            ingredients: List of Ingredient objects to match against

        Returns:
            Best MatchResult or None if no good match found
        """
        normalized = self.normalize_name(raw_name)

        best_match: MatchResult | None = None

        for ingredient in ingredients:
            match = self.match_against_ingredient(normalized, ingredient)
            if match:
                if best_match is None or match.confidence > best_match.confidence:
                    best_match = match

        # Return only if confidence is above threshold
        if best_match and best_match.confidence >= Decimal("0.6"):
            return best_match

        return None
