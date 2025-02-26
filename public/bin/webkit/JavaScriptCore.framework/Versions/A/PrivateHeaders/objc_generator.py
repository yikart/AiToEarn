#!/usr/bin/env python3
#
# Copyright (c) 2014, 2016 Apple Inc. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
# 1. Redistributions of source code must retain the above copyright
#    notice, this list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright
#    notice, this list of conditions and the following disclaimer in the
#    documentation and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
# THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
# PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
# BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
# THE POSSIBILITY OF SUCH DAMAGE.

import logging
try:
    from .generator import Generator, ucfirst
    from .models import PrimitiveType, ObjectType, ArrayType, EnumType, AliasedType, Frameworks
except ImportError:
    from generator import Generator, ucfirst
    from models import PrimitiveType, ObjectType, ArrayType, EnumType, AliasedType, Frameworks

log = logging.getLogger('global')


def join_type_and_name(type_str, name_str):
    if type_str.endswith('*'):
        return type_str + name_str
    return type_str + ' ' + name_str


def strip_block_comment_markers(str):
    return str.replace('/*', '').replace('*/', '')


def remove_duplicate_from_str(str, possible_duplicate):
    return str.replace(possible_duplicate + possible_duplicate, possible_duplicate)


_OBJC_IDENTIFIER_RENAME_MAP = {
    'this': 'thisObject',  # Debugger.CallFrame.this
    'description': 'stringRepresentation',  # Runtime.RemoteObject.description
    'id': 'identifier',  # Page.Frame.id, Runtime.ExecutionContextDescription.id, Debugger.BreakpointAction.id
}

_OBJC_IDENTIFIER_REVERSE_RENAME_MAP = dict((v, k) for k, v in _OBJC_IDENTIFIER_RENAME_MAP.items())


class ObjCTypeCategory:
    Simple = 0
    String = 1
    Object = 2
    Array = 3

    @staticmethod
    def category_for_type(_type):
        if (isinstance(_type, PrimitiveType)):
            if _type.raw_name() == 'string':
                return ObjCTypeCategory.String
            if  _type.raw_name() in ['object', 'any']:
                return ObjCTypeCategory.Object
            if _type.raw_name() == 'array':
                return ObjCTypeCategory.Array
            return ObjCTypeCategory.Simple
        if (isinstance(_type, ObjectType)):
            return ObjCTypeCategory.Object
        if (isinstance(_type, ArrayType)):
            return ObjCTypeCategory.Array
        if (isinstance(_type, AliasedType)):
            return ObjCTypeCategory.category_for_type(_type.aliased_type)
        if (isinstance(_type, EnumType)):
            return ObjCTypeCategory.category_for_type(_type.primitive_type)
        return None

# Almost all Objective-C class names require the use of a prefix that depends on the
# target framework's 'objc_prefix' setting. So, most helpers are instance methods.

class ObjCGenerator(Generator):
    # Do not use a dynamic prefix for RWIProtocolJSONObject since it's used as a common
    # base class and needs a consistent Objective-C prefix to be in a reusable framework.
    OBJC_HELPER_PREFIX = 'RWI'
    OBJC_SHARED_PREFIX = 'Protocol'
    OBJC_STATIC_PREFIX = '%s%s' % (OBJC_HELPER_PREFIX, OBJC_SHARED_PREFIX)

    def __init__(self, *args, **kwargs):
        Generator.__init__(self, *args, **kwargs)

    # The 'protocol name' is used to prefix filenames for a protocol group (a set of domains generated together).
    def protocol_name(self):
        protocol_group = self.model().framework.setting('objc_protocol_group', '')
        return '%s%s' % (protocol_group, ObjCGenerator.OBJC_SHARED_PREFIX)

    # The 'ObjC prefix' is used to prefix Objective-C class names and enums with a
    # framework-specific prefix. It is separate from filename prefixes.
    def objc_prefix(self):
        framework_prefix = self.model().framework.setting('objc_prefix', None)
        if not framework_prefix:
            return ''
        else:
            return '%s%s' % (framework_prefix, ObjCGenerator.OBJC_SHARED_PREFIX)

    # Adjust identifier names that collide with ObjC keywords.

    @staticmethod
    def identifier_to_objc_identifier(name):
        return _OBJC_IDENTIFIER_RENAME_MAP.get(name, name)

    @staticmethod
    def objc_identifier_to_identifier(name):
        return _OBJC_IDENTIFIER_REVERSE_RENAME_MAP.get(name, name)

    # Generate ObjC types, command handlers, and event dispatchers for a subset of domains.

    DOMAINS_TO_GENERATE = ['CSS', 'DOM', 'DOMStorage', 'Network', 'Security', 'Page', 'Automation', 'GenericTypes']

    def should_generate_types_for_domain(self, domain):
        if not len(self.type_declarations_for_domain(domain)):
            return False

        if self.model().framework is Frameworks.Test:
            return True

        allowlist = set(ObjCGenerator.DOMAINS_TO_GENERATE)
        allowlist.update(set(['Console', 'Debugger', 'Runtime']))
        return domain.domain_name in allowlist

    def should_generate_commands_for_domain(self, domain):
        if not len(self.commands_for_domain(domain)):
            return False

        if self.model().framework is Frameworks.Test:
            return True

        allowlist = set(ObjCGenerator.DOMAINS_TO_GENERATE)
        return domain.domain_name in allowlist

    def should_generate_events_for_domain(self, domain):
        if not len(self.events_for_domain(domain)):
            return False

        if self.model().framework is Frameworks.Test:
            return True

        allowlist = set(ObjCGenerator.DOMAINS_TO_GENERATE)
        allowlist.add('Console')
        return domain.domain_name in allowlist

    # ObjC enum and type names.

    def objc_name_for_type(self, type):
        name = type.qualified_name().replace('.', '')
        name = remove_duplicate_from_str(name, type.type_domain().domain_name)
        return '%s%s' % (self.objc_prefix(), name)

    def objc_enum_name_for_anonymous_enum_declaration(self, declaration):
        domain_name = declaration.type.type_domain().domain_name
        name = '%s%s' % (domain_name, declaration.type.raw_name())
        name = remove_duplicate_from_str(name, domain_name)
        return '%s%s' % (self.objc_prefix(), name)

    def objc_enum_name_for_anonymous_enum_member(self, declaration, member):
        domain_name = member.type.type_domain().domain_name
        name = '%s%s%s' % (domain_name, declaration.type.raw_name(), ucfirst(member.member_name))
        name = remove_duplicate_from_str(name, domain_name)
        return '%s%s' % (self.objc_prefix(), name)

    def objc_enum_name_for_anonymous_enum_parameter(self, domain, event_or_command_name, parameter):
        domain_name = domain.domain_name
        name = '%s%s%s' % (domain_name, ucfirst(event_or_command_name), ucfirst(parameter.parameter_name))
        name = remove_duplicate_from_str(name, domain_name)
        return '%s%s' % (self.objc_prefix(), name)

    def objc_enum_name_for_non_anonymous_enum(self, _type):
        domain_name = _type.type_domain().domain_name
        name = _type.qualified_name().replace('.', '')
        name = remove_duplicate_from_str(name, domain_name)
        return '%s%s' % (self.objc_prefix(), name)

    # Miscellaneous name handling.

    @staticmethod
    def variable_name_prefix_for_domain(domain):
        domain_name = domain.domain_name
        if domain_name.startswith('DOM'):
            return 'dom' + domain_name[3:]
        if domain_name.startswith('CSS'):
            return 'css' + domain_name[3:]
        return domain_name[:1].lower() + domain_name[1:]

    # Type basics.

    @staticmethod
    def objc_accessor_type_for_raw_name(raw_name):
        if raw_name in ['string', 'array']:
            return 'copy'
        if raw_name in ['integer', 'number', 'boolean']:
            return 'assign'
        if raw_name in ['any', 'object']:
            return 'retain'
        return None

    @staticmethod
    def objc_type_for_raw_name(raw_name):
        if raw_name == 'string':
            return 'NSString *'
        if raw_name == 'array':
            return 'NSArray *'
        if raw_name == 'integer':
            return 'int'
        if raw_name == 'number':
            return 'double'
        if raw_name == 'boolean':
            return 'BOOL'
        if raw_name in ['any', 'object']:
            return '%sJSONObject *' % ObjCGenerator.OBJC_STATIC_PREFIX
        return None

    @staticmethod
    def objc_class_for_raw_name(raw_name):
        if raw_name == 'string':
            return 'NSString'
        if raw_name == 'array':
            return 'NSArray'
        if raw_name in ['integer', 'number', 'boolean']:
            return 'NSNumber'
        if raw_name in ['any', 'object']:
            return '%sJSONObject' % ObjCGenerator.OBJC_STATIC_PREFIX
        return None

    # FIXME: Can these protocol_type functions be removed in favor of C++ generators functions?

    @staticmethod
    def protocol_type_for_raw_name(raw_name):
        if raw_name == 'string':
            return 'String'
        if raw_name == 'integer':
            return 'int'
        if raw_name == 'number':
            return 'double'
        if raw_name == 'boolean':
            return 'bool'
        if raw_name in ['any', 'object']:
            return 'JSON::Object'
        return None

    @staticmethod
    def protocol_type_for_type(_type):
        if (isinstance(_type, AliasedType)):
            _type = _type.aliased_type
        if (isinstance(_type, PrimitiveType)):
            return ObjCGenerator.protocol_type_for_raw_name(_type.raw_name())
        if (isinstance(_type, EnumType)):
            return ObjCGenerator.protocol_type_for_type(_type.primitive_type)
        if (isinstance(_type, ObjectType)):
            return 'Protocol::%s::%s' % (_type.type_domain().domain_name, _type.raw_name())
        if (isinstance(_type, ArrayType)):
            sub_type = ObjCGenerator.protocol_type_for_type(_type.element_type)
            return 'JSON::ArrayOf<%s>' % sub_type
        return None

    @staticmethod
    def is_type_objc_pointer_type(_type):
        if (isinstance(_type, AliasedType)):
            _type = _type.aliased_type
        if (isinstance(_type, PrimitiveType)):
            return _type.raw_name() in ['string', 'array', 'any', 'object']
        if (isinstance(_type, EnumType)):
            return False
        if (isinstance(_type, ObjectType)):
            return True
        if (isinstance(_type, ArrayType)):
            return True
        return None

    def objc_class_for_type(self, _type):
        if (isinstance(_type, AliasedType)):
            _type = _type.aliased_type
        if (isinstance(_type, PrimitiveType)):
            return ObjCGenerator.objc_class_for_raw_name(_type.raw_name())
        if (isinstance(_type, EnumType)):
            return ObjCGenerator.objc_class_for_raw_name(_type.primitive_type.raw_name())
        if (isinstance(_type, ObjectType)):
            return self.objc_name_for_type(_type)
        if (isinstance(_type, ArrayType)):
            sub_type = strip_block_comment_markers(self.objc_class_for_type(_type.element_type))
            return 'NSArray/*<%s>*/' % sub_type
        return None

    def objc_class_for_array_type(self, _type):
        if isinstance(_type, AliasedType):
            _type = _type.aliased_type
        if isinstance(_type, ArrayType):
            return self.objc_class_for_type(_type.element_type)
        return None

    def objc_accessor_type_for_member(self, member):
        return self.objc_accessor_type_for_member_internal(member.type)

    def objc_accessor_type_for_member_internal(self, _type):
        if (isinstance(_type, AliasedType)):
            _type = _type.aliased_type
        if (isinstance(_type, PrimitiveType)):
            return self.objc_accessor_type_for_raw_name(_type.raw_name())
        if (isinstance(_type, EnumType)):
            return 'assign'
        if (isinstance(_type, ObjectType)):
            return 'retain'
        if (isinstance(_type, ArrayType)):
            return 'copy'
        return None

    def objc_type_for_member(self, declaration, member):
        return self.objc_type_for_member_internal(member.type, declaration, member)

    def objc_type_for_member_internal(self, _type, declaration, member):
        if (isinstance(_type, AliasedType)):
            _type = _type.aliased_type
        if (isinstance(_type, PrimitiveType)):
            return self.objc_type_for_raw_name(_type.raw_name())
        if (isinstance(_type, EnumType)):
            if (_type.is_anonymous):
                return self.objc_enum_name_for_anonymous_enum_member(declaration, member)
            return self.objc_enum_name_for_non_anonymous_enum(_type)
        if (isinstance(_type, ObjectType)):
            return self.objc_name_for_type(_type) + ' *'
        if (isinstance(_type, ArrayType)):
            sub_type = strip_block_comment_markers(self.objc_class_for_type(_type.element_type))
            return 'NSArray/*<%s>*/ *' % sub_type
        return None

    def objc_type_for_param(self, domain, event_or_command_name, parameter, respect_optional=True):
        objc_type = self.objc_type_for_param_internal(parameter.type, domain, event_or_command_name, parameter)
        if respect_optional and parameter.is_optional:
            if objc_type.endswith('*'):
                return objc_type + '*'
            return objc_type + ' *'
        return objc_type

    def objc_type_for_param_internal(self, _type, domain, event_or_command_name, parameter):
        if (isinstance(_type, AliasedType)):
            _type = _type.aliased_type
        if (isinstance(_type, PrimitiveType)):
            return self.objc_type_for_raw_name(_type.raw_name())
        if (isinstance(_type, EnumType)):
            return self.objc_enum_name_for_non_anonymous_enum(_type)
        if (isinstance(_type, ObjectType)):
            return self.objc_name_for_type(_type) + ' *'
        if (isinstance(_type, ArrayType)):
            sub_type = strip_block_comment_markers(self.objc_class_for_type(_type.element_type))
            return 'NSArray/*<%s>*/ *' % sub_type
        return None

    # ObjC <-> Protocol conversion for commands and events.
    #   - convert a command call parameter received from Protocol to ObjC for handler
    #   - convert a command return parameter in callback block from ObjC to Protocol to send
    #   - convert an event parameter from ObjC API to Protocol to send

    def objc_protocol_export_expression_for_variable(self, var_type, var_name):
        category = ObjCTypeCategory.category_for_type(var_type)
        if category in [ObjCTypeCategory.Simple, ObjCTypeCategory.String]:
            if isinstance(var_type, EnumType):
                return 'toProtocolString(%s)' % var_name
            return var_name
        if category == ObjCTypeCategory.Object:
            return '[%s toJSONObject]' % var_name
        if category == ObjCTypeCategory.Array:
            protocol_type = ObjCGenerator.protocol_type_for_type(var_type.element_type)
            objc_class = self.objc_class_for_type(var_type.element_type)
            if protocol_type == 'JSON::ArrayOf<String>':
                return 'toJSONStringArrayArray(%s)' % var_name
            if protocol_type == 'String' and objc_class == 'NSString':
                return 'toJSONStringArray(%s)' % var_name
            if protocol_type == 'int' and objc_class == 'NSNumber':
                return 'toJSONIntegerArray(%s)' % var_name
            if protocol_type == 'double' and objc_class == 'NSNumber':
                return 'toJSONDoubleArray(%s)' % var_name
            return 'toJSONObjectArray(%s)' % var_name

    def objc_protocol_import_expression_for_member(self, name, declaration, member):
        if isinstance(member.type, EnumType):
            if member.type.is_anonymous:
                return 'fromProtocolString<%s>((__bridge CFStringRef)%s)' % (self.objc_enum_name_for_anonymous_enum_member(declaration, member), name)
            return 'fromProtocolString<%s>((__bridge CFStringRef)%s)' % (self.objc_enum_name_for_non_anonymous_enum(member.type), name)
        return self.objc_protocol_import_expression_for_variable(member.type, name)

    def objc_protocol_import_expression_for_parameter(self, name, domain, event_or_command_name, parameter):
        if isinstance(parameter.type, EnumType):
            return 'fromProtocolString<%s>(%s)' % (self.objc_enum_name_for_non_anonymous_enum(parameter.type), name)
        return self.objc_protocol_import_expression_for_variable(parameter.type, name)

    def objc_protocol_import_expression_for_variable(self, var_type, var_name):
        category = ObjCTypeCategory.category_for_type(var_type)
        if category in [ObjCTypeCategory.Simple, ObjCTypeCategory.String]:
            return var_name
        if category == ObjCTypeCategory.Object:
            objc_class = self.objc_class_for_type(var_type)
            return 'adoptNS([[%s alloc] initWithJSONObject:%s]).autorelease()' % (objc_class, var_name)
        if category == ObjCTypeCategory.Array:
            objc_class = self.objc_class_for_type(var_type.element_type)
            if objc_class == 'NSString':
                return 'toObjCStringArray(%s)' % var_name
            if objc_class == 'NSNumber':  # FIXME: Integer or Double?
                return 'toObjCIntegerArray(%s)' % var_name
            return 'toObjCArray<%s>(%s)' % (objc_class, var_name)

    # ObjC <-> JSON object conversion for types getters/setters.
    #   - convert a member setter from ObjC API to JSON object setter
    #   - convert a member getter from JSON object to ObjC API

    def objc_to_protocol_expression_for_member(self, declaration, member, sub_expression):
        category = ObjCTypeCategory.category_for_type(member.type)
        if category in [ObjCTypeCategory.Simple, ObjCTypeCategory.String]:
            if isinstance(member.type, EnumType):
                return 'toProtocolString(%s)' % sub_expression
            return sub_expression
        if category == ObjCTypeCategory.Object:
            return sub_expression
        if category == ObjCTypeCategory.Array:
            objc_class = self.objc_class_for_type(member.type.element_type)
            if objc_class == 'NSString':
                return 'toJSONStringArray(%s)' % sub_expression
            if objc_class == 'NSNumber':
                protocol_type = ObjCGenerator.protocol_type_for_type(member.type.element_type)
                if protocol_type == 'double':
                    return 'toJSONDoubleArray(%s)' % sub_expression
                return 'toJSONIntegerArray(%s)' % sub_expression
            return 'toJSONObjectArray(%s)' % sub_expression

    def protocol_to_objc_expression_for_member(self, declaration, member, sub_expression):
        category = ObjCTypeCategory.category_for_type(member.type)
        if category in [ObjCTypeCategory.Simple, ObjCTypeCategory.String]:
            if isinstance(member.type, EnumType):
                if member.type.is_anonymous:
                    return 'fromProtocolString<%s>((__bridge CFStringRef)%s).value()' % (self.objc_enum_name_for_anonymous_enum_member(declaration, member), sub_expression)
                return 'fromProtocolString<%s>((__bridge CFStringRef)%s).value()' % (self.objc_enum_name_for_non_anonymous_enum(member.type), sub_expression)
            return sub_expression
        if category == ObjCTypeCategory.Object:
            raise Exception("protocol_to_objc_expression_for_member does not support an Object type. See: protocol_to_objc_code_block_for_object_member")
        if category == ObjCTypeCategory.Array:
            protocol_type = ObjCGenerator.protocol_type_for_type(member.type.element_type)
            objc_class = self.objc_class_for_type(member.type.element_type)
            if objc_class == 'NSString':
                return 'toObjCStringArray(%s)' % sub_expression
            if objc_class == 'NSNumber':
                protocol_type = ObjCGenerator.protocol_type_for_type(member.type.element_type)
                if protocol_type == 'double':
                    return 'toObjCDoubleArray(%s)' % sub_expression
                return 'toObjCIntegerArray(%s)' % sub_expression
            return 'toObjCArray<%s>(%s)' % (objc_class, sub_expression)

    def protocol_to_objc_code_block_for_object_member(self, declaration, member, sub_expression):
        objc_class = self.objc_class_for_type(member.type)
        lines = []
        lines.append('    %sJSONObject *object = %s;' % (ObjCGenerator.OBJC_STATIC_PREFIX, sub_expression))
        lines.append('    if (!object)')
        lines.append('        return nil;')
        lines.append('    return [[%s alloc] initWithJSONObject:[%s toJSONObject].get()];' % (objc_class, sub_expression))
        return '\n'.join(lines)

    def payload_to_objc_expression_for_member(self, declaration, member):
        _type = member.type
        if isinstance(_type, AliasedType):
            _type = _type.aliased_type
        if isinstance(_type, PrimitiveType):
            sub_expression = 'payload[@"%s"]' % member.member_name
            raw_name = _type.raw_name()
            if raw_name == 'boolean':
                return '[%s boolValue]' % sub_expression
            if raw_name == 'integer':
                return '[%s integerValue]' % sub_expression
            if raw_name == 'number':
                return '[%s doubleValue]' % sub_expression
            if raw_name in ['any', 'object', 'array', 'string']:
                return sub_expression  # The setter will check the incoming value.
            return None
        if isinstance(member.type, EnumType):
            sub_expression = 'payload[@"%s"]' % member.member_name
            if member.type.is_anonymous:
                return 'fromProtocolString<%s>((__bridge CFStringRef)%s)' % (self.objc_enum_name_for_anonymous_enum_member(declaration, member), sub_expression)
            else:
                return 'fromProtocolString<%s>((__bridge CFStringRef)%s)' % (self.objc_enum_name_for_non_anonymous_enum(member.type), sub_expression)
        if isinstance(_type, ObjectType):
            objc_class = self.objc_class_for_type(member.type)
            return '[[%s alloc] initWithPayload:payload[@"%s"]]' % (objc_class, member.member_name)
        if isinstance(_type, ArrayType):
            element_type = member.type.element_type
            if isinstance(element_type, EnumType):
                element_type = element_type.primitive_type

            # In this case, there is no conversion that needs to be done, the array already contains an ObjC type.
            if isinstance(element_type, PrimitiveType):
                return 'payload[@"%s"]' % member.member_name
            else:
                objc_class = self.objc_class_for_type(element_type)
                return 'objcArrayFromPayload<%s>(payload[@"%s"])' % (objc_class, member.member_name)

    # JSON object setter/getter selectors for types.

    @staticmethod
    def objc_setter_method_for_member(declaration, member):
        return ObjCGenerator.objc_setter_method_for_member_internal(member.type, declaration, member)

    @staticmethod
    def objc_setter_method_for_member_internal(_type, declaration, member):
        if (isinstance(_type, AliasedType)):
            _type = _type.aliased_type
        if (isinstance(_type, PrimitiveType)):
            raw_name = _type.raw_name()
            if raw_name == 'boolean':
                return 'setBool'
            if raw_name == 'integer':
                return 'setInteger'
            if raw_name == 'number':
                return 'setDouble'
            if raw_name == 'string':
                return 'setString'
            if raw_name in ['any', 'object']:
                return 'setObject'
            if raw_name == 'array':
                return 'setJSONArray'
            return None
        if (isinstance(_type, EnumType)):
            return 'setString'
        if (isinstance(_type, ObjectType)):
            return 'setObject'
        if (isinstance(_type, ArrayType)):
            return 'setJSONArray'
        return None

    @staticmethod
    def objc_getter_method_for_member(declaration, member):
        return ObjCGenerator.objc_getter_method_for_member_internal(member.type, declaration, member)

    @staticmethod
    def objc_getter_method_for_member_internal(_type, declaration, member):
        if (isinstance(_type, AliasedType)):
            _type = _type.aliased_type
        if (isinstance(_type, PrimitiveType)):
            raw_name = _type.raw_name()
            if raw_name == 'boolean':
                return 'boolForKey'
            if raw_name == 'integer':
                return 'integerForKey'
            if raw_name == 'number':
                return 'doubleForKey'
            if raw_name == 'string':
                return 'stringForKey'
            if raw_name in ['any', 'object']:
                return 'objectForKey'
            if raw_name == 'array':
                return 'JSONArrayForKey'
            return None
        if (isinstance(_type, EnumType)):
            return 'stringForKey'
        if (isinstance(_type, ObjectType)):
            return 'objectForKey'
        if (isinstance(_type, ArrayType)):
            return 'JSONArrayForKey'
        return None
