import MealPlan from "../src/MealPlan"
import { parseMealPlan } from "../src/mealPlanAlgorithm"

test('parseAndTransformMealPlan returns empty meal plan if empty text passed', () => {
    const expectedMealPlan: MealPlan = {
        totalActualCalories: 0,
        totalActualCarbs: 0,
        totalActualFats: 0,
        totalActualProtein: 0,
        meals: []
    }
    expect(parseMealPlan("")).toEqual(expectedMealPlan)
})

test('parseAndTransformMealPlan can parse meal plan', () => {
    const input = `
        Breakfast
        - Grilled Chicken Breast | 6 oz
        - Whole Wheat Bread | 2 slices
        - Egg Yolk | 2 large

        Morning Snack
        - Protein Scoop | 1 scoop
        - Apple | 1 medium
        - Almond Butter | 1 tablespoon

        Lunch
        - Grilled Steak | 150 g
        - White Rice | 1 cup
        - Olive Oil | 1 tablespoon

        Afternoon Snack
        - Fried Tofu | 100 g
        - Sweet Potato | 1 medium
        - Peanut Butter | 1 tablespoon

        Dinner
        - Garbonzo Beans | 200 g
        - Pasta | 1 cup
        - Coconut Oil | 1 tablespoon
    `

    // For now just get what the output should be
    const output = parseMealPlan(input)
    console.log(`Output:\n\n${JSON.stringify(output)}`)
})