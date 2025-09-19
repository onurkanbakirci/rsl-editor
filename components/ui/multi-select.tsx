"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown, X, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

/**
 * Animation types and configurations
 */
export interface AnimationConfig {
	/** Badge animation type */
	badgeAnimation?: "bounce" | "pulse" | "wiggle" | "fade" | "slide" | "none"
	/** Popover animation type */
	popoverAnimation?: "scale" | "slide" | "fade" | "flip" | "none"
	/** Option hover animation type */
	optionHoverAnimation?: "highlight" | "scale" | "glow" | "none"
	/** Animation duration in seconds */
	duration?: number
	/** Animation delay in seconds */
	delay?: number
}

/**
 * Variants for the multi-select component to handle different styles.
 */
const multiSelectVariants = cva("m-1 transition-all duration-300 ease-in-out", {
	variants: {
		variant: {
			default: "border-foreground/10 text-foreground bg-card hover:bg-card/80",
			secondary:
				"border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
			destructive:
				"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
			inverted: "inverted",
		},
		badgeAnimation: {
			bounce: "hover:-translate-y-1 hover:scale-110",
			pulse: "hover:animate-pulse",
			wiggle: "hover:animate-wiggle",
			fade: "hover:opacity-80",
			slide: "hover:translate-x-1",
			none: "",
		},
	},
	defaultVariants: {
		variant: "default",
		badgeAnimation: "bounce",
	},
})

/**
 * Option interface for MultiSelect component
 */
export interface MultiSelectOption {
	/** The text to display for the option. */
	label: string
	/** The unique value associated with the option. */
	value: string
	/** Optional icon component to display alongside the option. */
	icon?: React.ComponentType<{ className?: string }>
	/** Whether this option is disabled */
	disabled?: boolean
	/** Custom styling for the option */
	style?: {
		/** Custom badge color */
		badgeColor?: string
		/** Custom icon color */
		iconColor?: string
		/** Gradient background for badge */
		gradient?: string
	}
}

/**
 * Group interface for organizing options
 */
export interface MultiSelectGroup {
	/** Group heading */
	heading: string
	/** Options in this group */
	options: MultiSelectOption[]
}

/**
 * Props for MultiSelect component
 */
export interface MultiSelectProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "animationConfig">,
		VariantProps<typeof multiSelectVariants> {
	/**
	 * An array of option objects or groups to be displayed in the multi-select component.
	 */
	options: MultiSelectOption[] | MultiSelectGroup[]
	/**
	 * Callback function triggered when the selected values change.
	 */
	onValueChange: (value: string[]) => void
	/** The default selected values when the component mounts. */
	defaultValue?: string[]
	/** Placeholder text to be displayed when no values are selected. */
	placeholder?: string
	/** Animation duration in seconds for the visual effects. */
	animation?: number
	/** Advanced animation configuration for different component parts. */
	animationConfig?: AnimationConfig
	/** Maximum number of items to display. Extra selected items will be summarized. */
	maxCount?: number
	/** The modality of the popover. */
	modalPopover?: boolean
	/** If true, renders the multi-select component as a child of another component. */
	asChild?: boolean
	/** Additional class names to apply custom styles to the multi-select component. */
	className?: string
	/** If true, disables the select all functionality. */
	hideSelectAll?: boolean
	/** If true, shows search functionality in the popover. */
	searchable?: boolean
	/** Custom empty state message when no options match search. */
	emptyIndicator?: React.ReactNode
	/** If true, allows the component to grow and shrink with its content. */
	autoSize?: boolean
	/** If true, shows badges in a single line with horizontal scroll. */
	singleLine?: boolean
	/** Custom CSS class for the popover content. */
	popoverClassName?: string
	/** If true, disables the component completely. */
	disabled?: boolean
	/** Responsive configuration for different screen sizes. */
	responsive?:
		| boolean
		| {
				mobile?: { maxCount?: number; hideIcons?: boolean; compactMode?: boolean }
				tablet?: { maxCount?: number; hideIcons?: boolean; compactMode?: boolean }
				desktop?: { maxCount?: number; hideIcons?: boolean; compactMode?: boolean }
		  }
	/** Minimum width for the component. */
	minWidth?: string
	/** Maximum width for the component. */
	maxWidth?: string
	/** If true, automatically removes duplicate options based on their value. */
	deduplicateOptions?: boolean
	/** If true, the component will reset its internal state when defaultValue changes. */
	resetOnDefaultValueChange?: boolean
	/** If true, automatically closes the popover after selecting an option. */
	closeOnSelect?: boolean
}

/**
 * Imperative methods exposed through ref
 */
export interface MultiSelectRef {
	reset: () => void
	getSelectedValues: () => string[]
	setSelectedValues: (values: string[]) => void
	clear: () => void
	focus: () => void
}

const MultiSelect = React.forwardRef<MultiSelectRef, MultiSelectProps>(
	(
		{
			options,
			onValueChange,
			variant,
			defaultValue = [],
			placeholder = "Select options",
			animation = 0,
			animationConfig,
			maxCount = 3,
			modalPopover = false,
			asChild = false,
			className,
			hideSelectAll = false,
			searchable = true,
			emptyIndicator,
			autoSize = false,
			singleLine = false,
			popoverClassName,
			disabled = false,
			responsive,
			minWidth,
			maxWidth,
			deduplicateOptions = false,
			resetOnDefaultValueChange = true,
			closeOnSelect = false,
			...props
		},
		ref
	) => {
		const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue)
		const [isOpen, setIsOpen] = React.useState(false)
		const [searchValue, setSearchValue] = React.useState("")
		const [isAnimating, setIsAnimating] = React.useState(false)

		const triggerRef = React.useRef<HTMLButtonElement>(null)
		const prevDefaultValueRef = React.useRef<string[]>(defaultValue)

		// Screen size detection for responsive behavior
		const [screenSize, setScreenSize] = React.useState<"mobile" | "tablet" | "desktop">("desktop")

		React.useEffect(() => {
			if (typeof window === "undefined") return
			const handleResize = () => {
				const width = window.innerWidth
				if (width < 640) {
					setScreenSize("mobile")
				} else if (width < 1024) {
					setScreenSize("tablet")
				} else {
					setScreenSize("desktop")
				}
			}
			handleResize()
			window.addEventListener("resize", handleResize)
			return () => window.removeEventListener("resize", handleResize)
		}, [])

		// Helper functions
		const isGroupedOptions = React.useCallback(
			(opts: MultiSelectOption[] | MultiSelectGroup[]): opts is MultiSelectGroup[] => {
				return opts.length > 0 && "heading" in opts[0]
			},
			[]
		)

		const arraysEqual = React.useCallback((a: string[], b: string[]): boolean => {
			if (a.length !== b.length) return false
			const sortedA = [...a].sort()
			const sortedB = [...b].sort()
			return sortedA.every((val, index) => val === sortedB[index])
		}, [])

		const getAllOptions = React.useCallback((): MultiSelectOption[] => {
			if (options.length === 0) return []
			let allOptions: MultiSelectOption[]
			if (isGroupedOptions(options)) {
				allOptions = options.flatMap((group) => group.options)
			} else {
				allOptions = options
			}

			if (deduplicateOptions) {
				const seen = new Set<string>()
				return allOptions.filter((option) => {
					if (seen.has(option.value)) {
						return false
					}
					seen.add(option.value)
					return true
				})
			}

			return allOptions
		}, [options, deduplicateOptions, isGroupedOptions])

		const getOptionByValue = React.useCallback(
			(value: string): MultiSelectOption | undefined => {
				return getAllOptions().find((option) => option.value === value)
			},
			[getAllOptions]
		)

		const getResponsiveSettings = () => {
			if (!responsive) {
				return { maxCount, hideIcons: false, compactMode: false }
			}
			if (responsive === true) {
				const defaultResponsive = {
					mobile: { maxCount: 2, hideIcons: false, compactMode: true },
					tablet: { maxCount: 4, hideIcons: false, compactMode: false },
					desktop: { maxCount: 6, hideIcons: false, compactMode: false },
				}
				const currentSettings = defaultResponsive[screenSize]
				return {
					maxCount: currentSettings?.maxCount ?? maxCount,
					hideIcons: currentSettings?.hideIcons ?? false,
					compactMode: currentSettings?.compactMode ?? false,
				}
			}
			const currentSettings = responsive[screenSize]
			return {
				maxCount: currentSettings?.maxCount ?? maxCount,
				hideIcons: currentSettings?.hideIcons ?? false,
				compactMode: currentSettings?.compactMode ?? false,
			}
		}

		const responsiveSettings = getResponsiveSettings()

		// Filter options based on search
		const filteredOptions = React.useMemo(() => {
			if (!searchable || !searchValue) return options
			if (options.length === 0) return []

			if (isGroupedOptions(options)) {
				return options
					.map((group) => ({
						...group,
						options: group.options.filter(
							(option) =>
								option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
								option.value.toLowerCase().includes(searchValue.toLowerCase())
						),
					}))
					.filter((group) => group.options.length > 0)
			}

			return options.filter(
				(option) =>
					option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
					option.value.toLowerCase().includes(searchValue.toLowerCase())
			)
		}, [options, searchValue, searchable, isGroupedOptions])

		// Event handlers
		const handleToggleOption = (optionValue: string) => {
			if (disabled) return
			const option = getOptionByValue(optionValue)
			if (option?.disabled) return

			const newSelectedValues = selectedValues.includes(optionValue)
				? selectedValues.filter((value) => value !== optionValue)
				: [...selectedValues, optionValue]

			setSelectedValues(newSelectedValues)
			onValueChange(newSelectedValues)

			if (closeOnSelect) {
				setIsOpen(false)
			}
		}

		const handleClear = () => {
			if (disabled) return
			setSelectedValues([])
			onValueChange([])
		}

		const handleSelectAll = () => {
			if (disabled) return
			const allOptions = getAllOptions().filter((option) => !option.disabled)
			const allValues = allOptions.map((option) => option.value)

			if (selectedValues.length === allValues.length) {
				handleClear()
			} else {
				setSelectedValues(allValues)
				onValueChange(allValues)
			}

			if (closeOnSelect) {
				setIsOpen(false)
			}
		}

		const clearExtraOptions = () => {
			if (disabled) return
			const newSelectedValues = selectedValues.slice(0, responsiveSettings.maxCount)
			setSelectedValues(newSelectedValues)
			onValueChange(newSelectedValues)
		}

		// Reset to default value when it changes
		React.useEffect(() => {
			if (!resetOnDefaultValueChange) return
			const prevDefaultValue = prevDefaultValueRef.current
			if (!arraysEqual(prevDefaultValue, defaultValue)) {
				if (!arraysEqual(selectedValues, defaultValue)) {
					setSelectedValues(defaultValue)
				}
				prevDefaultValueRef.current = [...defaultValue]
			}
		}, [defaultValue, selectedValues, arraysEqual, resetOnDefaultValueChange])

		// Clear search when popover closes
		React.useEffect(() => {
			if (!isOpen) {
				setSearchValue("")
			}
		}, [isOpen])

		// Imperative handle
		React.useImperativeHandle(
			ref,
			() => ({
				reset: () => {
					setSelectedValues(defaultValue)
					setIsOpen(false)
					setSearchValue("")
					onValueChange(defaultValue)
				},
				getSelectedValues: () => selectedValues,
				setSelectedValues: (values: string[]) => {
					setSelectedValues(values)
					onValueChange(values)
				},
				clear: () => {
					setSelectedValues([])
					onValueChange([])
				},
				focus: () => {
					triggerRef.current?.focus()
				},
			}),
			[selectedValues, onValueChange, defaultValue]
		)

		// Get animation classes
		const getBadgeAnimationClass = () => {
			if (animationConfig?.badgeAnimation) {
				switch (animationConfig.badgeAnimation) {
					case "bounce":
						return isAnimating ? "animate-bounce" : "hover:-translate-y-1 hover:scale-110"
					case "pulse":
						return "hover:animate-pulse"
					case "wiggle":
						return "hover:animate-wiggle"
					case "fade":
						return "hover:opacity-80"
					case "slide":
						return "hover:translate-x-1"
					case "none":
						return ""
					default:
						return ""
				}
			}
			return isAnimating ? "animate-bounce" : ""
		}

		// Width constraints
		const getWidthConstraints = () => {
			const defaultMinWidth = screenSize === "mobile" ? "0px" : "200px"
			const effectiveMinWidth = minWidth || defaultMinWidth
			const effectiveMaxWidth = maxWidth || "100%"
			return {
				minWidth: effectiveMinWidth,
				maxWidth: effectiveMaxWidth,
				width: autoSize ? "auto" : "100%",
			}
		}

		const widthConstraints = getWidthConstraints()

		return (
			<PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen} modal={modalPopover}>
				<PopoverPrimitive.Trigger asChild>
					<Button
						ref={triggerRef}
						{...props}
						disabled={disabled}
						variant="outline"
						role="combobox"
						aria-expanded={isOpen}
						className={cn(
							"flex p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit",
							autoSize ? "w-auto" : "w-full",
							responsiveSettings.compactMode && "min-h-8 text-sm",
							screenSize === "mobile" && "min-h-12 text-base",
							disabled && "opacity-50 cursor-not-allowed",
							className
						)}
						style={{
							...widthConstraints,
							maxWidth: `min(${widthConstraints.maxWidth}, 100%)`,
						}}
					>
						{selectedValues.length > 0 ? (
							<div className="flex justify-between items-center w-full">
								<div
									className={cn(
										"flex items-center gap-1",
										singleLine ? "overflow-x-auto" : "flex-wrap",
										responsiveSettings.compactMode && "gap-0.5"
									)}
								>
									{selectedValues.slice(0, responsiveSettings.maxCount).map((value) => {
										const option = getOptionByValue(value)
										if (!option) return null

										const IconComponent = option.icon
										const customStyle = option.style

										const badgeStyle: React.CSSProperties = {
											animationDuration: `${animation}s`,
											...(customStyle?.badgeColor && {
												backgroundColor: customStyle.badgeColor,
											}),
											...(customStyle?.gradient && {
												background: customStyle.gradient,
												color: "white",
											}),
										}

										return (
											<Badge
												key={value}
												variant={variant === "destructive" ? "destructive" : "secondary"}
												className={cn(
													getBadgeAnimationClass(),
													multiSelectVariants({ variant }),
													customStyle?.gradient && "text-white border-transparent",
													responsiveSettings.compactMode && "text-xs px-1.5 py-0.5",
													screenSize === "mobile" && "max-w-[120px] truncate",
													singleLine && "flex-shrink-0 whitespace-nowrap"
												)}
												style={badgeStyle}
											>
												{IconComponent && !responsiveSettings.hideIcons && (
													<IconComponent
														className={cn(
															"h-4 w-4 mr-2",
															responsiveSettings.compactMode && "h-3 w-3 mr-1"
														)}
													/>
												)}
												<span
													className={cn(screenSize === "mobile" && "truncate")}
												>
													{option.label}
												</span>
												<button
													type="button"
													onClick={(e) => {
														e.preventDefault()
														e.stopPropagation()
														handleToggleOption(value)
													}}
													className="ml-2 h-4 w-4 cursor-pointer hover:bg-white/20 rounded-sm p-0.5 -m-0.5 focus:outline-none focus:ring-1 focus:ring-white/50"
													aria-label={`Remove ${option.label}`}
												>
													<X
														className={cn(
															"h-3 w-3",
															responsiveSettings.compactMode && "h-2.5 w-2.5"
														)}
													/>
												</button>
											</Badge>
										)
									})}
									{selectedValues.length > responsiveSettings.maxCount && (
										<Badge
											variant="secondary"
											className={cn(
												"bg-transparent text-foreground border-foreground/20",
												getBadgeAnimationClass(),
												responsiveSettings.compactMode && "text-xs px-1.5 py-0.5",
												singleLine && "flex-shrink-0 whitespace-nowrap"
											)}
										>
											{`+ ${selectedValues.length - responsiveSettings.maxCount} more`}
											<button
												type="button"
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													clearExtraOptions()
												}}
												className="ml-2 h-4 w-4 cursor-pointer"
											>
												<X
													className={cn(
														"h-3 w-3",
														responsiveSettings.compactMode && "h-2.5 w-2.5"
													)}
												/>
											</button>
										</Badge>
									)}
								</div>
								<div className="flex items-center justify-between">
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											handleClear()
										}}
										className="flex items-center justify-center h-4 w-4 mx-2 cursor-pointer text-muted-foreground hover:text-foreground"
										aria-label="Clear all selections"
									>
										<X className="h-4 w-4" />
									</button>
									<Separator orientation="vertical" className="flex min-h-6 h-full" />
									<ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between w-full mx-auto">
								<span className="text-sm text-muted-foreground mx-3">{placeholder}</span>
								<ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
							</div>
						)}
					</Button>
				</PopoverPrimitive.Trigger>

				<PopoverPrimitive.Portal>
					<PopoverPrimitive.Content
						className={cn(
							"z-50 w-auto p-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
							"animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
							screenSize === "mobile" && "w-[85vw] max-w-[280px]",
							screenSize === "tablet" && "w-[70vw] max-w-md",
							screenSize === "desktop" && "min-w-[300px]",
							popoverClassName
						)}
						style={{
							maxWidth: `min(${widthConstraints.maxWidth}, 85vw)`,
							maxHeight: screenSize === "mobile" ? "70vh" : "60vh",
						}}
						align="start"
						sideOffset={4}
					>
						<div className="flex flex-col">
							{/* Search Input */}
							{searchable && (
								<div className="flex items-center border-b px-3 py-2">
									<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
									<Input
										placeholder="Search options..."
										value={searchValue}
										onChange={(e) => setSearchValue(e.target.value)}
										className="flex-1 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
									/>
								</div>
							)}

							{/* Options List */}
							<ScrollArea
								className={cn(
									"max-h-[40vh] overflow-y-auto",
									screenSize === "mobile" && "max-h-[50vh]"
								)}
							>
								<div className="p-1">
									{/* Select All Option */}
									{!hideSelectAll && !searchValue && (
										<>
											<div
												className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
												onClick={handleSelectAll}
											>
												<Checkbox
													checked={
														selectedValues.length ===
														getAllOptions().filter((opt) => !opt.disabled).length
													}
													onCheckedChange={handleSelectAll}
												/>
												<span>Select All</span>
											</div>
											<Separator className="my-1" />
										</>
									)}

									{/* Options */}
									{isGroupedOptions(filteredOptions) ? (
										filteredOptions.map((group) => (
											<div key={group.heading}>
												<div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
													{group.heading}
												</div>
												{group.options.map((option) => {
													const isSelected = selectedValues.includes(option.value)
													const IconComponent = option.icon

													return (
														<div
															key={option.value}
															className={cn(
																"flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
																option.disabled && "opacity-50 cursor-not-allowed"
															)}
															onClick={() =>
																!option.disabled && handleToggleOption(option.value)
															}
														>
															<Checkbox
																checked={isSelected}
																disabled={option.disabled}
																onCheckedChange={() => handleToggleOption(option.value)}
															/>
															{IconComponent && (
																<IconComponent className="h-4 w-4 text-muted-foreground" />
															)}
															<span>{option.label}</span>
														</div>
													)
												})}
											</div>
										))
									) : (
										filteredOptions.map((option) => {
											const isSelected = selectedValues.includes(option.value)
											const IconComponent = option.icon

											return (
												<div
													key={option.value}
													className={cn(
														"flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
														option.disabled && "opacity-50 cursor-not-allowed"
													)}
													onClick={() =>
														!option.disabled && handleToggleOption(option.value)
													}
												>
													<Checkbox
														checked={isSelected}
														disabled={option.disabled}
														onCheckedChange={() => handleToggleOption(option.value)}
													/>
													{IconComponent && (
														<IconComponent className="h-4 w-4 text-muted-foreground" />
													)}
													<span>{option.label}</span>
												</div>
											)
										})
									)}

									{/* Empty State */}
									{filteredOptions.length === 0 && (
										<div className="py-6 text-center text-sm text-muted-foreground">
											{emptyIndicator || "No results found."}
										</div>
									)}
								</div>
							</ScrollArea>

							{/* Footer Actions */}
							{selectedValues.length > 0 && (
								<>
									<Separator />
									<div className="flex items-center justify-between p-2">
										<Button variant="ghost" size="sm" onClick={handleClear}>
											Clear
										</Button>
										<Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
											Close
										</Button>
									</div>
								</>
							)}
						</div>
					</PopoverPrimitive.Content>
				</PopoverPrimitive.Portal>
			</PopoverPrimitive.Root>
		)
	}
)

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }