import { adjustMacros } from '../src/mealPlanAlgorithm';
import MealPlan from '../src/MealPlan';
import Meal from '../src/Meal';
import Food from '../src/Food';

const mealPlan: MealPlan = {
    totalActualCalories: 0,
    totalActualCarbs: 0,
    totalActualFats: 0,
    totalActualProtein: 0,
    meals: [
        {
            name: 'Breakfast',
            totalCalories: 0,
            totalCarbs: 0,
            totalFats: 0,
            totalProtein: 0,
            foods: [
                {
                    name: "Fried Tofu",
                    unitCalories: 271,
                    unitCarbs: 10,
                    unitFats: 2,
                    unitProtein: 17,
                    unitAmount: 100,
                    desiredAmount: 100,
                    maxDesiredAmount: 200,
                    unit: "g",
                    primaryMacroClass: "Protein",
                },
                {
                    name: "Whole Wheat Bread",
                    unitCalories: 69,
                    unitCarbs: 12,
                    unitFats: 1,
                    unitProtein: 3.6,
                    unitAmount: 1,
                    desiredAmount: 2,
                    maxDesiredAmount: 2,
                    unit: "slice",
                    primaryMacroClass: "Carb",
                },
                {
                    name: "Peanut Butter",
                    unitCalories: 188,
                    unitCarbs: 6,
                    unitFats: 16,
                    unitProtein: 8,
                    unitAmount: 2,
                    desiredAmount: 4,
                    maxDesiredAmount: 4,
                    unit: "tablespoons",
                    primaryMacroClass: "Fat",
                },
            ]
        },
        {
            name: 'Mid-Morning Snack',
            totalCalories: 0,
            totalCarbs: 0,
            totalFats: 0,
            totalProtein: 0,
            foods: [
                {
                    name: "Protein Scoop",
                    unitCalories: 120,
                    unitCarbs: 3,
                    unitFats: 2,
                    unitProtein: 24,
                    unitAmount: 1,
                    desiredAmount: 1,
                    maxDesiredAmount: 2,
                    unit: "scoop",
                    primaryMacroClass: "Protein",
                },
                {
                    name: "Apple",
                    descriptor: "(medium)",
                    unitCalories: 95,
                    unitCarbs: 25,
                    unitFats: 0.3,
                    unitProtein: 0.5,
                    unitAmount: 1,
                    desiredAmount: 1,
                    maxDesiredAmount: 2,
                    unit: "medium",
                    primaryMacroClass: "Carb",
                },
                {
                    name: "Almond Butter",
                    unitCalories: 196,
                    unitCarbs: 6,
                    unitFats: 18,
                    unitProtein: 7,
                    unitAmount: 2,
                    desiredAmount: 2,
                    maxDesiredAmount: 4,
                    unit: "tablespoons",
                    primaryMacroClass: "Fat",
                },
            ]
        },
        {
            name: 'Lunch',
            totalCalories: 0,
            totalCarbs: 0,
            totalFats: 0,
            totalProtein: 0,
            foods: [
                {
                    name: "Grilled Chicken Breast",
                    unitCalories: 120,
                    unitCarbs: 0,
                    unitFats: 3,
                    unitProtein: 26,
                    unitAmount: 4,
                    desiredAmount: 4,
                    maxDesiredAmount: 8,
                    unit: "oz",
                    primaryMacroClass: "Protein",
                },
                {
                    name: "White Rice",
                    descriptor: "(cooked)",
                    unitCalories: 205,
                    unitCarbs: 45,
                    unitFats: 0.4,
                    unitProtein: 4.3,
                    unitAmount: 1,
                    desiredAmount: 1,
                    maxDesiredAmount: 2,
                    unit: "cup",
                    primaryMacroClass: "Carb",
                },
                {
                    name: "Olive Oil",
                    unitCalories: 119,
                    unitCarbs: 0,
                    unitFats: 13.5,
                    unitProtein: 0,
                    unitAmount: 1,
                    desiredAmount: 1,
                    maxDesiredAmount: 2,
                    unit: "tablespoon",
                    primaryMacroClass: "Fat",
                },
            ]
        },
        {
            name: 'Afternoon Snack',
            totalCalories: 0,
            totalCarbs: 0,
            totalFats: 0,
            totalProtein: 0,
            foods: [
                {
                    name: "Garbonzo Beans",
                    unitCalories: 364,
                    unitCarbs: 61,
                    unitFats: 6,
                    unitProtein: 19,
                    unitAmount: 100,
                    desiredAmount: 100,
                    maxDesiredAmount: 200,
                    unit: "g",
                    primaryMacroClass: "Protein",
                },
                {
                    name: "Sweet Potato",
                    descriptor: "(medium, cooked)",
                    unitCalories: 112,
                    unitCarbs: 26,
                    unitFats: 0.1,
                    unitProtein: 2,
                    unitAmount: 1,
                    desiredAmount: 1,
                    maxDesiredAmount: 2,
                    unit: "medium",
                    primaryMacroClass: "Carb",
                },
                {
                    name: "Egg Yolk",
                    descriptor: "(large)",
                    unitCalories: 55,
                    unitCarbs: 0.6,
                    unitFats: 4.5,
                    unitProtein: 2.7,
                    unitAmount: 1,
                    desiredAmount: 1,
                    maxDesiredAmount: 2,
                    unit: "large",
                    primaryMacroClass: "Fat",
                },
            ]
        },
        {
            name: 'Dinner',
            totalCalories: 0,
            totalCarbs: 0,
            totalFats: 0,
            totalProtein: 0,
            foods: [
                {
                    name: "Grilled Steak",
                    unitCalories: 307,
                    unitCarbs: 0,
                    unitFats: 20,
                    unitProtein: 29,
                    unitAmount: 110,
                    desiredAmount: 110,
                    maxDesiredAmount: 220,
                    unit: "g",
                    primaryMacroClass: "Protein",
                },
                {
                    name: "Pasta",
                    descriptor: "(cooked)",
                    unitCalories: 200,
                    unitCarbs: 42,
                    unitFats: 1,
                    unitProtein: 7,
                    unitAmount: 1,
                    desiredAmount: 1,
                    maxDesiredAmount: 2,
                    unit: "cup",
                    primaryMacroClass: "Carb",
                },
                {
                    name: "Coconut Oil",
                    unitCalories: 121,
                    unitCarbs: 0,
                    unitFats: 13.5,
                    unitProtein: 0,
                    unitAmount: 1,
                    desiredAmount: 1,
                    maxDesiredAmount: 2,
                    unit: "tablespoon",
                    primaryMacroClass: "Fat",
                },
            ]
        }
    ]
};

const withinVariance = (actual: number, expected: number, variance: number) => {
    return Math.abs(actual - expected) / expected <= variance;
};

describe('adjustMacros', () => {
    it('should adjust the meal plan to meet the desired macros', () => {
        const desiredCalories = 2000;
        const carbPercentage = 0.5; // 50% of calories from carbs
        const fatPercentage = 0.2; // 20% of calories from fats
        const proteinPercentage = 0.3; // 30% of calories from proteins

        const adjustedMealPlan = adjustMacros(mealPlan, desiredCalories, carbPercentage, fatPercentage, proteinPercentage);

        // Log total vs desired macros
        console.log(`Actual Calories: ${adjustedMealPlan.totalActualCalories} | Desired Calories: ${desiredCalories}`);
        console.log(`Actual Carbs: ${adjustedMealPlan.totalActualCarbs} | Desired Carbs: ${desiredCalories * carbPercentage / 4}`);
        console.log(`Actual Fats: ${adjustedMealPlan.totalActualFats} | Desired Fats: ${desiredCalories * fatPercentage / 9}`);
        console.log(`Actual Protein: ${adjustedMealPlan.totalActualProtein} | Desired Protein: ${desiredCalories * proteinPercentage / 4}`);
        // expect(withinVariance(adjustedMealPlan.totalActualCalories, desiredCalories, 0.03)).toBe(true);
        // expect(withinVariance(adjustedMealPlan.totalActualCarbs, desiredCalories * carbPercentage / 4, 0.03)).toBe(true);
        // expect(withinVariance(adjustedMealPlan.totalActualFats, desiredCalories * fatPercentage / 9, 0.03)).toBe(true);
        // expect(withinVariance(adjustedMealPlan.totalActualProtein, desiredCalories * proteinPercentage / 4, 0.03)).toBe(true);
    });
});