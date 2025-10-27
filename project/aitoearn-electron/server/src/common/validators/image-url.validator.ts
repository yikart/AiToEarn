import {
  registerDecorator,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidImageUrl', async: false })
class IsValidImageUrlConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return false;

    // 检查是否是有效的图片URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some((ext) => value.toLowerCase().endsWith(ext));
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property}必须是有效的图片URL地址`;
  }
}

export function IsValidImageUrl() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      validator: IsValidImageUrlConstraint,
    });
  };
}
