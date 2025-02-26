#!/usr/bin/env python3
#
# Copyright (c) 2014-2018 Apple Inc. All rights reserved.
# Copyright (c) 2014 University of Washington. All rights reserved.
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
import string
from string import Template
from operator import methodcaller

try:
    from .cpp_generator import CppGenerator
    from .cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from .generator import Generator, ucfirst
    from .models import AliasedType, ArrayType, EnumType, ObjectType
except ImportError:
    from cpp_generator import CppGenerator
    from cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from generator import Generator, ucfirst
    from models import AliasedType, ArrayType, EnumType, ObjectType

log = logging.getLogger('global')


class CppProtocolTypesImplementationGenerator(CppGenerator):
    def __init__(self, *args, **kwargs):
        CppGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return "%sProtocolObjects.cpp" % self.protocol_name()

    def generate_output(self):
        domains = self.domains_to_generate()
        self.calculate_types_requiring_shape_assertions(domains)

        secondary_headers = [
            '<optional>',
            '<wtf/text/CString.h>',
        ]

        header_args = {
            'primaryInclude': '"%sProtocolObjects.h"' % self.protocol_name(),
            'secondaryIncludes': self._generate_secondary_header_includes(),
        }

        sections = []
        sections.append(self.generate_license())
        sections.append(Template(CppTemplates.ImplementationPrelude).substitute(None, **header_args))
        sections.append('namespace Protocol {')
        sections.extend(self._generate_enum_mapping_and_conversion_methods(domains))
        builder_sections = list(map(self._generate_builders_for_domain, domains))
        sections.extend([section for section in builder_sections if len(section) > 0])
        sections.append('} // namespace Protocol')
        sections.append(Template(CppTemplates.ImplementationPostlude).substitute(None, **header_args))

        return "\n\n".join(sections)

    # Private methods.

    def _generate_secondary_header_includes(self):
        header_includes = [
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/Assertions.h")),
        ]
        return '\n'.join(self.generate_includes_from_entries(header_includes))

    def _generate_enum_mapping(self):
        if not self.assigned_enum_values():
            return []

        lines = []
        lines.append('static const auto enum_constant_values = std::to_array<ASCIILiteral>({')
        lines.extend(['    "%s"_s,' % enum_value for enum_value in self.assigned_enum_values()])
        lines.append('});')
        lines.append('')
        lines.append('String getEnumConstantValue(int code) {')
        lines.append('    return enum_constant_values[code];')
        lines.append('}')
        return ['\n'.join(lines)]

    def _generate_enum_conversion_methods_for_domain(self, domain):

        def type_member_is_anonymous_enum_type(type_member):
            return isinstance(type_member.type, EnumType) and type_member.type.is_anonymous

        def generate_conversion_method_body(enum_type, cpp_protocol_type):
            body_lines = []
            body_lines.extend([
                'template<> std::optional<%s> parseEnumValueFromString<%s>(const String& protocolString)' % (cpp_protocol_type, cpp_protocol_type),
                '{',
                '    static const auto constantValues = std::to_array<size_t>({',
            ])

            enum_values = enum_type.enum_values()
            for enum_value in enum_values:
                body_lines.append('        (size_t)%s::%s,' % (cpp_protocol_type, Generator.stylized_name_for_enum_value(enum_value)))

            body_lines.extend([
                '    });',
                '    for (size_t i = 0; i < %d; ++i)' % len(enum_values),
                '        if (protocolString == enum_constant_values[constantValues[i]])',
                '            return (%s)constantValues[i];' % cpp_protocol_type,
                '',
                '    return std::nullopt;',
                '}',
            ])
            return '\n'.join(body_lines)

        type_declarations = self.type_declarations_for_domain(domain)
        declaration_types = [decl.type for decl in type_declarations]
        object_types = [_type for _type in declaration_types if isinstance(_type, ObjectType)]
        enum_types = [_type for _type in declaration_types if isinstance(_type, EnumType)]
        if len(object_types) + len(enum_types) == 0:
            return ''

        sorted(object_types, key=methodcaller('raw_name'))
        sorted(enum_types, key=methodcaller('raw_name'))

        lines = []
        lines.append("// Enums in the '%s' Domain" % domain.domain_name)
        for enum_type in enum_types:
            cpp_protocol_type = CppGenerator.cpp_type_for_enum(enum_type, enum_type.raw_name())
            lines.append('')
            lines.append(self.wrap_with_guard_for_condition(enum_type.declaration().condition, generate_conversion_method_body(enum_type, cpp_protocol_type)))

        for object_type in object_types:
            object_lines = []
            for enum_member in filter(type_member_is_anonymous_enum_type, object_type.members):
                cpp_protocol_type = CppGenerator.cpp_type_for_enum(enum_member.type, '%s::%s' % (object_type.raw_name(), ucfirst(enum_member.member_name)))
                object_lines.append(generate_conversion_method_body(enum_member.type, cpp_protocol_type))
            if len(object_lines):
                if len(lines):
                    lines.append('')
                lines.append(self.wrap_with_guard_for_condition(object_type.declaration().condition, '\n'.join(object_lines)))

        if len(lines) == 1:
            return ''  # No real declarations to emit, just the domain comment.

        return self.wrap_with_guard_for_condition(domain.condition, '\n'.join(lines))

    def _generate_enum_mapping_and_conversion_methods(self, domains):
        sections = []
        sections.append('namespace %s {' % self.helpers_namespace())
        sections.extend(self._generate_enum_mapping())
        enum_parser_sections = list(map(self._generate_enum_conversion_methods_for_domain, domains))
        sections.extend([section for section in enum_parser_sections if len(section) > 0])
        if len(sections) == 1:
            return []  # No declarations to emit, just the namespace.

        sections.append('} // namespace %s' % self.helpers_namespace())
        return sections

    def _generate_builders_for_domain(self, domain):
        sections = []
        type_declarations = self.type_declarations_for_domain(domain)
        declarations_to_generate = [decl for decl in type_declarations if self.type_needs_shape_assertions(decl.type)]

        for type_declaration in declarations_to_generate:
            type_lines = []
            for type_member in type_declaration.type_members:
                if isinstance(type_member.type, EnumType):
                    type_lines.append(self._generate_assertion_for_enum(type_member, type_declaration))

            if isinstance(type_declaration.type, ObjectType):
                type_lines.append(self._generate_assertion_for_object_declaration(type_declaration))
                if Generator.type_needs_runtime_casts(type_declaration.type):
                    type_lines.append(self._generate_runtime_cast_for_object_declaration(type_declaration))
            if len(type_lines):
                sections.append(self.wrap_with_guard_for_condition(type_declaration.condition, '\n\n'.join(type_lines)))

        if not len(sections):
            return ''

        return self.wrap_with_guard_for_condition(domain.condition, '\n\n'.join(sections))

    def _generate_runtime_cast_for_object_declaration(self, object_declaration):
        args = {
            'objectType': CppGenerator.cpp_protocol_type_for_type(object_declaration.type)
        }
        return Template(CppTemplates.ProtocolObjectRuntimeCast).substitute(None, **args)

    def _generate_assertion_for_object_declaration(self, object_declaration):
        required_members = [member for member in object_declaration.type_members if not member.is_optional]
        optional_members = [member for member in object_declaration.type_members if member.is_optional]
        should_count_properties = not Generator.type_has_open_fields(object_declaration.type)
        lines = []

        lines.append('void BindingTraits<%s>::assertValueHasExpectedType(JSON::Value* value)' % (CppGenerator.cpp_protocol_type_for_type(object_declaration.type)))
        lines.append("""{
    ASSERT_UNUSED(value, value);
#if ASSERT_ENABLED
    auto object = value->asObject();
    ASSERT(object);""")
        for type_member in required_members:
            member_type = type_member.type
            if isinstance(member_type, AliasedType):
                member_type = member_type.aliased_type

            if isinstance(member_type, EnumType):
                member_type = CppGenerator.cpp_type_for_enum(member_type, '%s::%s' % (object_declaration.type_name, ucfirst(type_member.member_name)))
            else:
                member_type = CppGenerator.cpp_protocol_type_for_type(member_type)

            args = {
                'memberName': type_member.member_name,
                'memberType': member_type
            }

            lines.append("""    {
        auto %(memberName)sPos = object->find("%(memberName)s"_s);
        ASSERT(%(memberName)sPos != object->end());
        BindingTraits<%(memberType)s>::assertValueHasExpectedType(%(memberName)sPos->value.ptr());
    }""" % args)

        lines.append('')
        lines.append('    size_t foundPropertiesCount = %s;' % len(required_members))

        for type_member in optional_members:
            member_type = type_member.type
            if isinstance(member_type, AliasedType):
                member_type = member_type.aliased_type

            if isinstance(member_type, EnumType):
                member_type = CppGenerator.cpp_type_for_enum(member_type, '%s::%s' % (object_declaration.type_name, ucfirst(type_member.member_name)))
            else:
                member_type = CppGenerator.cpp_protocol_type_for_type(member_type)

            args = {
                'memberName': type_member.member_name,
                'memberType': member_type
            }

            lines.append("""    {
        auto %(memberName)sPos = object->find("%(memberName)s"_s);
        if (%(memberName)sPos != object->end()) {
            BindingTraits<%(memberType)s>::assertValueHasExpectedType(%(memberName)sPos->value.ptr());""" % args)

            lines.append('            ++foundPropertiesCount;')
            lines.append('        }')
            lines.append('    }')

        lines.append('    if (foundPropertiesCount %s object->size())' % ('!=' if should_count_properties else '>='))
        lines.append('        FATAL("Unexpected properties in object: %s\\n", object->toJSONString().ascii().data());')
        lines.append('#endif')
        lines.append('}')
        return '\n'.join(lines)

    def _generate_assertion_for_enum(self, enum_member, object_declaration):
        lines = []
        lines.append('void BindingTraits<%s>::assertValueHasExpectedType(JSON::Value* value)' % CppGenerator.cpp_type_for_enum(enum_member.type, '%s::%s' % (object_declaration.type_name, ucfirst(enum_member.member_name))))
        lines.append('{')
        lines.append('    ASSERT_UNUSED(value, value);')
        lines.append('#if ASSERT_ENABLED')
        lines.append('    auto result = value->asString();')
        lines.append('    ASSERT(result);')

        assert_condition = ' || '.join(['result == "%s"_s' % enum_value for enum_value in enum_member.type.enum_values()])
        lines.append('    ASSERT(%s);' % assert_condition)
        lines.append('#endif')
        lines.append('}')

        return '\n'.join(lines)
