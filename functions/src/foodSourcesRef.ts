import Food from "./Food"

export const proteinSourcesRef: Food[] = [
	{
		name: "Grilled Chicken Breast",
		unitCalories: 120,
		unitCarbs: 0,
		unitFats: 3,
		unitProtein: 26,
		unitAmount: 4,
		desiredAmount: 4,
		unit: "oz",
		primaryMacroClass: "Protein",
	},
	{
		name: "Grilled Steak",
		unitCalories: 307,
		unitCarbs: 0,
		unitFats: 20,
		unitProtein: 29,
		unitAmount: 110,
		desiredAmount: 110,
		unit: "g",
		primaryMacroClass: "Protein",
	},
	{
		name: "Protein Scoop",
		unitCalories: 120,
		unitCarbs: 3,
		unitFats: 2,
		unitProtein: 24,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "scoop",
		primaryMacroClass: "Protein",
	},
	{
		name: "Garbonzo Beans",
		unitCalories: 364,
		unitCarbs: 61,
		unitFats: 6,
		unitProtein: 19,
		unitAmount: 100,
		desiredAmount: 100,
		unit: "g",
		primaryMacroClass: "Protein",
	},
	{
		name: "Fried Tofu",
		unitCalories: 271,
		unitCarbs: 10,
		unitFats: 2,
		unitProtein: 17,
		unitAmount: 100,
		desiredAmount: 100,
		unit: "g",
		primaryMacroClass: "Protein",
	},
]

export const carbSourcesRef: Food[] = [
	{
		name: "Pasta (cooked)",
		unitCalories: 200,
		unitCarbs: 42,
		unitFats: 1,
		unitProtein: 7,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "cup",
		primaryMacroClass: "Carb",
	},
	{
		name: "White Rice (cooked)",
		unitCalories: 205,
		unitCarbs: 45,
		unitFats: 0.4,
		unitProtein: 4.3,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "cup",
		primaryMacroClass: "Carb",
	},
	{
		name: "Whole Wheat Bread",
		unitCalories: 69,
		unitCarbs: 12,
		unitFats: 1,
		unitProtein: 3.6,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "slice",
		primaryMacroClass: "Carb",
	},
	{
		name: "Sweet Potato (medium, cooked)",
		unitCalories: 112,
		unitCarbs: 26,
		unitFats: 0.1,
		unitProtein: 2,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "medium",
		primaryMacroClass: "Carb",
	},
	{
		name: "Apple (medium)",
		unitCalories: 95,
		unitCarbs: 25,
		unitFats: 0.3,
		unitProtein: 0.5,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "medium",
		primaryMacroClass: "Carb",
	},
]

export const fatSourcesRef: Food[] = [
	{
		name: "Olive Oil",
		unitCalories: 119,
		unitCarbs: 0,
		unitFats: 13.5,
		unitProtein: 0,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "tablespoon",
		primaryMacroClass: "Fat",
	},
	{
		name: "Coconut Oil",
		unitCalories: 121,
		unitCarbs: 0,
		unitFats: 13.5,
		unitProtein: 0,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "tablespoon",
		primaryMacroClass: "Fat",
	},
	{
		name: "Peanut Butter",
		unitCalories: 188,
		unitCarbs: 6,
		unitFats: 16,
		unitProtein: 8,
		unitAmount: 2,
		desiredAmount: 2,
		unit: "tablespoons",
		primaryMacroClass: "Fat",
	},
	{
		name: "Almond Butter",
		unitCalories: 196,
		unitCarbs: 6,
		unitFats: 18,
		unitProtein: 7,
		unitAmount: 2,
		desiredAmount: 2,
		unit: "tablespoons",
		primaryMacroClass: "Fat",
	},
	{
		name: "Egg Yolk (large)",
		unitCalories: 55,
		unitCarbs: 0.6,
		unitFats: 4.5,
		unitProtein: 2.7,
		unitAmount: 1,
		desiredAmount: 1,
		unit: "large",
		primaryMacroClass: "Fat",
	},
]