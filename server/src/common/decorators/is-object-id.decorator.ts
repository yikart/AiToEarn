import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isValidObjectId } from 'mongoose';

@ValidatorConstraint({ name: 'isObjectId', async: false })
export class IsObjectIdConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value) return true;
    return isValidObjectId(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} 必须是有效的 ObjectId`;
  }
}

export function IsObjectId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isObjectId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsObjectIdConstraint,
    });
  };
}
