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
        - Fried Tofu | 100g
        - Whole Wheat Bread | 2 slices
        - Peanut Butter | 2 tbsp

        Mid-Morning Snack
        - Protein Scoop | 1 scoop
        - Apple (medium) | 1
        - Almond Butter | 1 tbsp

        Lunch
        - Grilled Chicken Breast | 6oz
        - White Rice (cooked) | 1 cup
        - Olive Oil | 1 tbsp

        Afternoon Snack
        - Garbonzo Beans | 1 cup
        - Sweet Potato (medium, cooked) | 1
        - Egg Yolk (large) | 1

        Dinner
        - Grilled Steak | 200g
        - Pasta (cooked) | 1 cup
        - Coconut Oil | 1 tbsp
    `
    // const expectedMealPlan: MealPlan = {
    //     totalActualCalories: 0,
    //     totalActualCarbs: 0,
    //     totalActualFats: 0,
    //     totalActualProtein: 0,
    //     meals: [

    //     ]
    // }
    // expect(parseAndTransformMealPlan(input)).toEqual(expectedMealPlan)

    // For now just get what the output should be
    const output = parseMealPlan(input)
    console.log(`Output:\n\n${JSON.stringify(output)}`)
})