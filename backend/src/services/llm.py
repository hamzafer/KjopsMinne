"""LLM service interface for AI-powered extraction tasks."""

from typing import Protocol


class LLMService(Protocol):
    """Protocol for LLM service implementations."""

    async def extract_recipe(self, html: str) -> dict:
        """
        Extract recipe data from HTML using LLM.

        Args:
            html: Raw HTML content from a recipe page

        Returns:
            Dictionary with extracted recipe data including:
            - name: Recipe title
            - instructions: Cooking instructions
            - servings: Number of servings
            - ingredients: List of ingredient strings
            - tags: List of tags/keywords
            - prep_time_minutes: Optional preparation time
            - cook_time_minutes: Optional cooking time
        """
        ...
