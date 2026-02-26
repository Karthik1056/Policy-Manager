# Field Rules Documentation

## Overview
The field rules system allows you to define validation rules and requirements for each field dynamically. Rules are stored as JSON in the database and can be easily managed through the UI.

## Rules JSON Structure

```json
{
  "required": true,
  "validations": [
    {
      "type": "min",
      "value": "18"
    },
    {
      "type": "max",
      "value": "65"
    }
  ]
}
```

## Available Rule Types

### 1. **Required**
- Type: `boolean`
- Description: Marks the field as mandatory
- Example: `"required": true`

### 2. **Min**
- Type: `min`
- Description: Minimum numeric value
- Example: `{ "type": "min", "value": "18" }`
- Use case: Age must be at least 18

### 3. **Max**
- Type: `max`
- Description: Maximum numeric value
- Example: `{ "type": "max", "value": "65" }`
- Use case: Age cannot exceed 65

### 4. **MinLength**
- Type: `minLength`
- Description: Minimum string length
- Example: `{ "type": "minLength", "value": "8" }`
- Use case: Password must be at least 8 characters

### 5. **MaxLength**
- Type: `maxLength`
- Description: Maximum string length
- Example: `{ "type": "maxLength", "value": "100" }`
- Use case: Description cannot exceed 100 characters

### 6. **Pattern**
- Type: `pattern`
- Description: Regular expression pattern
- Example: `{ "type": "pattern", "value": "^[A-Z]{2}[0-9]{6}$" }`
- Use case: PAN card format validation

### 7. **Email**
- Type: `email`
- Description: Email format validation
- Example: `{ "type": "email", "value": "true" }`
- Use case: Validate email address format

### 8. **URL**
- Type: `url`
- Description: URL format validation
- Example: `{ "type": "url", "value": "true" }`
- Use case: Validate website URL format

## Example Use Cases

### Age Field
```json
{
  "required": true,
  "validations": [
    { "type": "min", "value": "18" },
    { "type": "max", "value": "65" }
  ]
}
```

### Income Field
```json
{
  "required": true,
  "validations": [
    { "type": "min", "value": "25000" },
    { "type": "max", "value": "10000000" }
  ]
}
```

### Phone Number
```json
{
  "required": true,
  "validations": [
    { "type": "pattern", "value": "^[0-9]{10}$" },
    { "type": "minLength", "value": "10" },
    { "type": "maxLength", "value": "10" }
  ]
}
```

### Email Field
```json
{
  "required": true,
  "validations": [
    { "type": "email", "value": "true" }
  ]
}
```

### Credit Score
```json
{
  "required": false,
  "validations": [
    { "type": "min", "value": "300" },
    { "type": "max", "value": "900" }
  ]
}
```

## Document Notes

Document notes provide contextual information to users about what documents or information is required for a field. These notes are displayed in a highlighted section below the field.

### Example Document Notes:

**For Self-Employment Income:**
```
The applicant must provide proof of income stability over the last 3 years. 
This includes but is not limited to:
- Income Tax Returns (ITR)
- Audited financial statements
- Bank statements showing regular deposits

Failure to provide adequate documentation within 30 days may result in 
application rejection.
```

**For Age Verification:**
```
Applicants must provide valid government-issued ID proof showing date of birth.
Accepted documents:
- Passport
- Driving License
- Aadhaar Card
- Voter ID
```

## UI Features

1. **Dynamic Rule Builder**: Add/remove validation rules on the fly
2. **Required Toggle**: Simple checkbox to mark fields as required
3. **Rule Type Dropdown**: Select from predefined validation types
4. **Visual Display**: Rules are displayed in a user-friendly format with icons
5. **Document Notes Section**: Highlighted section for important documentation requirements

## Benefits

- **Flexibility**: Add any number of validation rules per field
- **Maintainability**: Rules stored as JSON, easy to update
- **User-Friendly**: Clear visual representation of requirements
- **Scalable**: Easy to add new rule types in the future
- **Documentation**: Built-in support for field-level documentation
