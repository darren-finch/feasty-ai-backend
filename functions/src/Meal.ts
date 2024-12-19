import Food from "./Food"

export default interface Meal {
	name: string
	totalCalories: number
	totalCarbs: number
	totalFats: number
	totalProtein: number
	foods: Food[]
}