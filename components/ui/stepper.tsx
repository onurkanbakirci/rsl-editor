"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/shared/icons";

interface StepperContextValue {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

const StepperContext = React.createContext<StepperContextValue | undefined>(
  undefined
);

function useStepper() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a Stepper");
  }
  return context;
}

interface StepperProps {
  children: React.ReactNode;
  currentStep: number;
  onStepChange: (step: number) => void;
  className?: string;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ children, currentStep, onStepChange, className, ...props }, ref) => {
    const steps = React.Children.toArray(children);
    const totalSteps = steps.length;

    const goToStep = React.useCallback(
      (step: number) => {
        if (step >= 0 && step < totalSteps) {
          onStepChange(step);
        }
      },
      [totalSteps, onStepChange]
    );

    const nextStep = React.useCallback(() => {
      goToStep(currentStep + 1);
    }, [currentStep, goToStep]);

    const prevStep = React.useCallback(() => {
      goToStep(currentStep - 1);
    }, [currentStep, goToStep]);

    const canGoNext = currentStep < totalSteps - 1;
    const canGoPrev = currentStep > 0;

    const contextValue: StepperContextValue = {
      currentStep,
      totalSteps,
      goToStep,
      nextStep,
      prevStep,
      canGoNext,
      canGoPrev,
    };

    return (
      <StepperContext.Provider value={contextValue}>
        <div ref={ref} className={cn("space-y-6", className)} {...props}>
          {children}
        </div>
      </StepperContext.Provider>
    );
  }
);
Stepper.displayName = "Stepper";

interface StepperHeaderProps {
  className?: string;
}

const StepperHeader = React.forwardRef<HTMLDivElement, StepperHeaderProps>(
  ({ className, ...props }, ref) => {
    const { currentStep, totalSteps } = useStepper();

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between", className)}
        {...props}
      >
        <div className="flex items-center space-x-4">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={index} className="flex items-center">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    {
                      "border-primary bg-primary text-primary-foreground":
                        isActive,
                      "border-primary bg-primary text-primary-foreground":
                        isCompleted,
                      "border-muted-foreground text-muted-foreground":
                        isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Icons.check className="size-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={cn(
                      "ml-4 h-0.5 w-16 transition-colors",
                      index < currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
StepperHeader.displayName = "StepperHeader";

interface StepProps {
  children: React.ReactNode;
  className?: string;
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    );
  }
);
Step.displayName = "Step";

interface StepperContentProps {
  className?: string;
  children: React.ReactNode;
}

const StepperContent = React.forwardRef<HTMLDivElement, StepperContentProps>(
  ({ className, children, ...props }, ref) => {
    const { currentStep } = useStepper();

    return (
      <div ref={ref} className={cn("min-h-[400px]", className)} {...props}>
        {React.Children.toArray(children)[currentStep]}
      </div>
    );
  }
);
StepperContent.displayName = "StepperContent";

interface StepperFooterProps {
  className?: string;
  children?: React.ReactNode;
}

const StepperFooter = React.forwardRef<HTMLDivElement, StepperFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between pt-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StepperFooter.displayName = "StepperFooter";

export {
  Stepper,
  StepperHeader,
  Step,
  StepperContent,
  StepperFooter,
  useStepper,
};
