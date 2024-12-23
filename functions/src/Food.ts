export default interface Food {
	name: string
	descriptor?: string
	unitCalories: number
	unitCarbs: number
	unitFats: number
	unitProtein: number
	unitAmount: number
	desiredAmount: number
	maxDesiredAmount: number
	unit: string
	primaryMacroClass: string
}