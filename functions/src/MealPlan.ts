import Meal from "./Meal"

export default interface MealPlan {
	totalActualCalories: number
	totalActualCarbs: number
	totalActualFats: number
	totalActualProtein: number
	meals: Meal[]
}