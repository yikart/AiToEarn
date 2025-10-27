import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateRange', async: false })
export class IsDateRange implements ValidatorConstraintInterface {
  validate(propertyValue: Date, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];

    if (!propertyValue || !relatedValue) return true;

    return propertyValue < relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.property}必须早于${relatedPropertyName}`;
  }
}
