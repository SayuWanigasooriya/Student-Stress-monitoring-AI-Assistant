from logic.decision_logic import (
    ImpactLevel,
    IndicatorLevel,
    calculate_wellbeing_impact,
    categorize_emotions,
    determine_indicator_level,
)


def test_categorize_emotions_returns_distressed_for_stress_signals():
    assert categorize_emotions(["stressed", "tired"]) == "distressed"


def test_determine_indicator_level_returns_elevated_for_burnout_terms():
    assert determine_indicator_level(["burnout", "anxiety"]) == IndicatorLevel.ELEVATED.value


def test_calculate_wellbeing_impact_returns_low_for_stable_positive_case():
    assert (
        calculate_wellbeing_impact("positive", IndicatorLevel.STABLE.value)
        == ImpactLevel.LOW.value
    )
