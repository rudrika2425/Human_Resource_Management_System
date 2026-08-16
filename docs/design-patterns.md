# Design Patterns Used

## Strategy

Used in payroll calculation.

- `PayrollCalculationStrategy`
- `StandardPayrollStrategy`
- `ContractPayrollStrategy`

Why: payroll logic differs by employment type, so the calculation can change without changing the service layer.

## Factory

Used in payroll strategy selection.

- `PayrollStrategyFactory`

Why: the payroll service selects the right calculation strategy based on employment type.

## Repository

Used across all persistence modules.

Why: keeps database access isolated from business logic.

## DTO / Mapper Style

Used across all controllers and services.

Why: keeps entities out of the HTTP contract and avoids JPA serialization issues.

## Service Layer

Used in every module.

Why: business rules, validations, and transactions belong in services, not controllers.

## Builder

Used for complex responses and entity construction in several modules.

Why: some objects have many optional fields and are easier to construct safely with builders.

## Why Abstract Factory Was Not Used

No module had a real family of related object variants that justified an abstract factory. Using one here would have added indirection without solving a concrete problem.
