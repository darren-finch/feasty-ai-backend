import { configDotenv } from "dotenv"
import OpenAI from "openai"
import Food from "./Food"
import MealPlan from "./MealPlan"
import Meal from "./Meal"
import { carbSourcesRef, fatSourcesRef, proteinSourcesRef } from "./foodSourcesRef"
import { roundingPrecisions } from "./roundingPrecisions"

configDotenv()

const openai = new OpenAI()
  
const NUM_RETRIES = 3

export const createMealPlan = async (
	mealsPerDay: number,
	desiredCalories: number,
	desiredCarbPercentage: number,
	desiredFatPercentage: number,
	desiredProteinPercentage: number
) => {
	const openAiApiKey = process.env.OPENAI_API_KEY
	if (openAiApiKey == null) return null

	const proteinNamesAndUnits = proteinSourcesRef.map((food: Food) => `"${food.name} - ${food.unit}"`)
	const carbNamesAndUnits = carbSourcesRef.map((food: Food) => `"${food.name} - ${food.unit}"`)
	const fatNamesAndUnits = fatSourcesRef.map((food: Food) => `"${food.name} - ${food.unit}"`)

	const desiredCarbPercentageAsDecimal = desiredCarbPercentage / 100
	const desiredFatPercentageAsDecimal = desiredFatPercentage / 100
	const desiredProteinPercentageAsDecimal = desiredProteinPercentage / 100

	try {
		for (let i = 0; i < NUM_RETRIES; i++) {
			const prompt = `
Create a one day meal plan with ${mealsPerDay} meals using the following exact food names and serving units.
The meal plan should have very close to ${desiredCalories} calories, ${(desiredCalories * desiredCarbPercentageAsDecimal / 4).toFixed(2)}g of carbs, ${(desiredCalories * desiredProteinPercentageAsDecimal / 4).toFixed(2)}g of protein, and ${(desiredCalories * desiredFatPercentageAsDecimal / 9).toFixed(2)}g of fat.

Proteins: ${proteinNamesAndUnits.join(", ")}
Carbs: ${carbNamesAndUnits.join(", ")}
Fats: ${fatNamesAndUnits.join(", ")}

Give your output in this format:

<Meal Name>
- <Food name> | <serving amount> <serving unit>
- <Food name> | <serving amount> <serving unit>
- <Food name> | <serving amount> <serving unit>

<Meal Name>
- <Food name> | <serving amount> <serving unit>
- <Food name> | <serving amount> <serving unit>
- <Food name> | <serving amount> <serving unit>

Only give me the names of each meal, the expected serving amounts, and the names of each food going into the meal.
Don't give me the summary or any other explanation. Don't list "Meal 1", "Meal 2", etc, in the meal names.
And above all, remember to use the exact food names and serving units I provided. Thanks!
			`

			console.log(prompt)

			const completion = await openai.chat.completions.create({
				messages: [{ role: "system", content: prompt }],
				temperature: 0.5,
				model: "gpt-4o",
			})

			const mealPlanString = completion.choices[0].message.content
			if (!mealPlanString) throw new Error("No response from ChatGPT")

			try {
				const mealPlan = parseMealPlan(mealPlanString)

				adjustMacros(mealPlan, desiredCalories, desiredCarbPercentageAsDecimal, desiredFatPercentageAsDecimal, desiredProteinPercentageAsDecimal)
				return mealPlan
			} catch (error) {
				console.log(error)
				console.log(`Couldn't parse ChatGPT output, retry #${i + 1}...`)
				continue
			}
		}
		throw Error("Failed to generate meal plan")
	} catch (error) {
		console.error("Error generating meal plan:", error)
		return null
	}
}

export function parseMealPlan(mealPlanText: string): MealPlan {
	console.log(`\n\nParsing mealPlanText = \'${mealPlanText}\'`)
	if (mealPlanText == "") {
		return {
			totalActualCalories: 0,
			totalActualCarbs: 0,
			totalActualFats: 0,
			totalActualProtein: 0,
			meals: [],
		}
	}

	const meals: Meal[] = []
	const mealBlocks = mealPlanText.trim().split("\n\n")

	mealBlocks.forEach((block) => {
		// console.log(`In for each block for block = \'${block}\'`)
		const lines = block.split("\n")
		const mealName = lines[0].trim()

		const foods: Food[] = lines.slice(1).map((line) => {
			const [foodName, serving] = line.replace("- ", "").split(" | ")
			
			// Splits up the value and unit of the serving
			const match = serving.match(/^(\d+(?:\.\d+)?)(?:\s*([a-zA-Z]+.*)?)?$/);

			if (match) {
				const [_, servingAmount, servingUnit] = match; // Use destructuring to get the captured groups

				// Find the matching food from the reference lists
				const foodRef =
					proteinSourcesRef.find((food) => food.name === foodName.trim()) ||
					carbSourcesRef.find((food) => food.name === foodName.trim()) ||
					fatSourcesRef.find((food) => food.name === foodName.trim())

				if (!foodRef) throw new Error(`Food item ${foodName} not found in references`)

				return {
					...foodRef,
					desiredAmount: Math.trunc(parseFloat(servingAmount)),
					unit: servingUnit ? servingUnit.trim() : "pcs",
				}

			} else {
				throw new Error(`Invalid serving size format`)
			}
		})

		const meal: Meal = {
			name: mealName,
			totalCalories: 0,
			totalCarbs: 0,
			totalFats: 0,
			totalProtein: 0,
			foods,
		}

		updateMealMacros(meal)

		meals.push(meal)
	})

	return {
		totalActualCalories: Math.trunc(meals.reduce((sum, meal) => sum + meal.totalCalories, 0)),
		totalActualCarbs: Math.trunc(meals.reduce((sum, meal) => sum + meal.totalCarbs, 0)),
		totalActualFats: Math.trunc(meals.reduce((sum, meal) => sum + meal.totalFats, 0)),
		totalActualProtein: Math.trunc(meals.reduce((sum, meal) => sum + meal.totalProtein, 0)),
		meals,
	}
}

function roundToNaturalMeasurement(amount: number, unit: string): number {
    const precision = roundingPrecisions[unit.toLowerCase()] || 2; // Default to 2 if unit not found
    return Math.round(amount * precision) / precision;
}

export function adjustMacros(mealPlan: MealPlan, desiredCalories: number, carbPercentage: number, fatPercentage: number, proteinPercentage: number): MealPlan {
    const varianceThreshold = 0.03; // 3%
    const maxIterations = 10000; // Maximum number of iterations for the while loop

    const desiredCarbs = desiredCalories * carbPercentage / 4; // 1 gram of carbs = 4 calories
    const desiredFats = desiredCalories * fatPercentage / 9; // 1 gram of fat = 9 calories
    const desiredProteins = desiredCalories * proteinPercentage / 4; // 1 gram of protein = 4 calories

    updateMealPlanMacros(mealPlan);

    const isWithinVariance = (actual: number, desired: number) => Math.abs(actual - desired) / desired <= varianceThreshold;

    const getMacroDifference = () => {
        const carbDiff = (mealPlan.totalActualCarbs - desiredCarbs) * 4; // Convert to calories
        const fatDiff = (mealPlan.totalActualFats - desiredFats) * 9; // Convert to calories
        const proteinDiff = (mealPlan.totalActualProtein - desiredProteins) * 4; // Convert to calories
        const calorieDiff = mealPlan.totalActualCalories - desiredCalories;

        return { carbDiff, fatDiff, proteinDiff, calorieDiff };
    };

    const adjustFoodAmount = (food: Food, incrementPercentage: number, increase: boolean) => {
        food.desiredAmount += increase ? food.desiredAmount * incrementPercentage : -food.desiredAmount * incrementPercentage;
        // food.desiredAmount = roundToNaturalMeasurement(food.desiredAmount, food.unit);
    };

    const incrementPercentage = 0.1; // 10%
    let iterationCount = 0;

    while (
        (!isWithinVariance(mealPlan.totalActualCalories, desiredCalories) ||
        !isWithinVariance(mealPlan.totalActualCarbs, desiredCarbs) ||
        !isWithinVariance(mealPlan.totalActualFats, desiredFats) ||
        !isWithinVariance(mealPlan.totalActualProtein, desiredProteins)) &&
        iterationCount < maxIterations
    ) {
        const { carbDiff, fatDiff, proteinDiff, calorieDiff } = getMacroDifference();

        if (!isWithinVariance(mealPlan.totalActualCalories, desiredCalories)) {
            const macroDiffs = [
                { macro: 'Carb', diff: carbDiff },
                { macro: 'Fat', diff: fatDiff },
                { macro: 'Protein', diff: proteinDiff }
            ];
            const largestNegativeDiffMacro = macroDiffs.reduce((prev, current) => (prev.diff < current.diff ? prev : current)).macro;
            const largestPositiveDiffMacro = macroDiffs.reduce((prev, current) => (prev.diff > current.diff ? prev : current)).macro;

			// console.log(`Largest negative diff macro = ${largestNegativeDiffMacro}`)
			// console.log(`Largest positive diff macro = ${largestPositiveDiffMacro}`)

            if (calorieDiff < 0) {
                // Increase calories
                const foodsToIncrease = mealPlan.meals.flatMap(meal => meal.foods.filter(food => food.primaryMacroClass === largestNegativeDiffMacro && food.desiredAmount < food.maxDesiredAmount));
                const randomFood = foodsToIncrease[Math.floor(Math.random() * foodsToIncrease.length)];
                adjustFoodAmount(randomFood, incrementPercentage, true);
            } else {
                // Decrease calories
                const foodsToDecrease = mealPlan.meals.flatMap(meal => meal.foods.filter(food => food.primaryMacroClass === largestPositiveDiffMacro));
                const randomFood = foodsToDecrease[Math.floor(Math.random() * foodsToDecrease.length)];
                adjustFoodAmount(randomFood, incrementPercentage, false);
            }
        } else {
            // Adjust the macro with the largest absolute difference in calories
            const macroDiffs = [
                { macro: 'Carb', diff: Math.abs(carbDiff) },
                { macro: 'Fat', diff: Math.abs(fatDiff) },
                { macro: 'Protein', diff: Math.abs(proteinDiff) }
            ];
            const largestDiffMacro = macroDiffs.reduce((prev, current) => (prev.diff > current.diff ? prev : current)).macro;

			// print out the largestDiffMacro
			// console.log(`Largest diff macro = ${largestDiffMacro}`)

            if (largestDiffMacro === 'Carb') {
                if (carbDiff < 0) {
                    // Increase carbs
                    const foodsToIncrease = mealPlan.meals.flatMap(meal => meal.foods.filter(food => food.primaryMacroClass === 'Carb' && food.desiredAmount < food.maxDesiredAmount));
                    const randomFood = foodsToIncrease[Math.floor(Math.random() * foodsToIncrease.length)];
                    adjustFoodAmount(randomFood, incrementPercentage, true);
                } else {
                    // Decrease carbs
                    const foodsToDecrease = mealPlan.meals.flatMap(meal => meal.foods.filter(food => food.primaryMacroClass === 'Carb'));
                    const randomFood = foodsToDecrease[Math.floor(Math.random() * foodsToDecrease.length)];
                    adjustFoodAmount(randomFood, incrementPercentage, false);
                }
            } else if (largestDiffMacro === 'Fat') {
                if (fatDiff < 0) {
                    // Increase fats
                    const foodsToIncrease = mealPlan.meals.flatMap(meal => meal.foods.filter(food => food.primaryMacroClass === 'Fat' && food.desiredAmount < food.maxDesiredAmount));
                    const randomFood = foodsToIncrease[Math.floor(Math.random() * foodsToIncrease.length)];
                    adjustFoodAmount(randomFood, incrementPercentage, true);
                } else {
                    // Decrease fats
                    const foodsToDecrease = mealPlan.meals.flatMap(meal => meal.foods.filter(food => food.primaryMacroClass === 'Fat'));
                    const randomFood = foodsToDecrease[Math.floor(Math.random() * foodsToDecrease.length)];
                    adjustFoodAmount(randomFood, incrementPercentage, false);
                }
            } else if (largestDiffMacro === 'Protein') {
                if (proteinDiff < 0) {
                    // Increase proteins
                    const foodsToIncrease = mealPlan.meals.flatMap(meal => meal.foods.filter(food => food.primaryMacroClass === 'Protein' && food.desiredAmount < food.maxDesiredAmount));
                    const randomFood = foodsToIncrease[Math.floor(Math.random() * foodsToIncrease.length)];
                    adjustFoodAmount(randomFood, incrementPercentage, true);
                } else {
                    // Decrease proteins
                    const foodsToDecrease = mealPlan.meals.flatMap(meal => meal.foods.filter(food => food.primaryMacroClass === 'Protein'));
                    const randomFood = foodsToDecrease[Math.floor(Math.random() * foodsToDecrease.length)];
                    adjustFoodAmount(randomFood, incrementPercentage, false);
                }
            }
        }

        // Update meal plan macros
        updateMealPlanMacros(mealPlan);

        iterationCount++;
    }

    // Round desired amount to nearest natural measurement based on unit after adjustments
    mealPlan.meals.forEach(meal => {
        meal.foods.forEach(food => {
            food.desiredAmount = roundToNaturalMeasurement(food.desiredAmount, food.unit);
        });
    });

    // Recalculate totals after rounding
    updateMealPlanMacros(mealPlan);

	// Go through meal plan and find foods that don't have any amount and remove them
	mealPlan.meals.forEach(meal => {
		meal.foods = meal.foods.filter(food => food.desiredAmount > 0)
	})

    return mealPlan;
}

// Function to update a meals total macros based on current food amounts
export function updateMealMacros(meal: Meal) {
	meal.totalCalories = Math.trunc(meal.foods.reduce(
		(sum, food) => sum + food.unitCalories * (food.desiredAmount / food.unitAmount),
		0
	))
	meal.totalCarbs = Math.trunc(meal.foods.reduce(
		(sum, food) => sum + food.unitCarbs * (food.desiredAmount / food.unitAmount),
		0
	))
	meal.totalFats = Math.trunc(meal.foods.reduce(
		(sum, food) => sum + food.unitFats * (food.desiredAmount / food.unitAmount),
		0
	))
	meal.totalProtein = Math.trunc(meal.foods.reduce(
		(sum, food) => sum + food.unitProtein * (food.desiredAmount / food.unitAmount),
		0
	))
}

// Function to update the total macros of a meal plan based on the current meal macros
export function updateMealPlanMacros(mealPlan: MealPlan) {
	mealPlan.meals.forEach(meal => updateMealMacros(meal))
	mealPlan.totalActualCalories = Math.trunc(mealPlan.meals.reduce((sum, meal) => sum + meal.totalCalories, 0))
	mealPlan.totalActualCarbs = Math.trunc(mealPlan.meals.reduce((sum, meal) => sum + meal.totalCarbs, 0))
	mealPlan.totalActualFats = Math.trunc(mealPlan.meals.reduce((sum, meal) => sum + meal.totalFats, 0))
	mealPlan.totalActualProtein = Math.trunc(mealPlan.meals.reduce((sum, meal) => sum + meal.totalProtein, 0))
}