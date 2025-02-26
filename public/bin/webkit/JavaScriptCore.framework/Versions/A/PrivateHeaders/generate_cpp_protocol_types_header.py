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
import re
import string
from operator import methodcaller
from string import Template

try:
    from .cpp_generator import CppGenerator
    from .cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from .generator import Generator, ucfirst
    from .models import EnumType, ObjectType, PrimitiveType, AliasedType, ArrayType, Frameworks
except ImportError:
    from cpp_generator import CppGenerator
    from cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from generator import Generator, ucfirst
    from models import EnumType, ObjectType, PrimitiveType, AliasedType, ArrayType, Frameworks

log = logging.getLogger('global')


class CppProtocolTypesHeaderGenerator(CppGenerator):
    def __init__(self, *args, **kwargs):
        CppGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return "%sProtocolObjects.h" % self.protocol_name()

    def generate_output(self):
        domains = self.domains_to_generate()
        self.calculate_types_requiring_shape_assertions(domains)

        header_args = {
            'includes': self._generate_secondary_header_includes(),
            'typedefs': '',
        }

        sections = []
        sections.append(self.generate_license())
        sections.append(Template(CppTemplates.HeaderPrelude).substitute(None, **header_args))
        sections.append('namespace Protocol {')
        sections.append(self._generate_versions(domains))
        sections.append(self._generate_forward_declarations(domains))
        sections.append(self._generate_typedefs(domains))
        sections.extend(self._generate_enum_constant_value_conversion_methods())
        builder_sections = list(map(self._generate_builders_for_domain, domains))
        sections.extend([section for section in builder_sections if len(section) > 0])
        sections.append(self._generate_forward_declarations_for_binding_traits(domains))
        sections.extend(self._generate_declarations_for_enum_conversion_methods(domains))
        sections.append('} // namespace Protocol')
        sections.append(Template(CppTemplates.HeaderPostlude).substitute(None, **header_args))
        sections.extend(self._generate_hash_declarations(domains))
        return "\n\n".join(sections)

    # Private methods.

    # FIXME: move builders out of classes, uncomment forward declaration

    def _generate_secondary_header_includes(self):
        header_includes = [
            (["JavaScriptCore", "WebKit"], ("JavaScriptCore", "inspector/InspectorProtocolTypes.h")),
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/JSONValues.h")),
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/text/WTFString.h")),
        ]
        return '\n'.join(self.generate_includes_from_entries(header_includes))

    def _generate_versions(self, domains):
        sections = []

        for domain in domains:
            version = self.version_for_domain(domain)
            if not version:
                continue

            domain_lines = []
            domain_lines.append('namespace %s {' % domain.domain_name)

            if isinstance(version, int):
                domain_lines.append('static constexpr unsigned VERSION = %s;' % version)

            domain_lines.append('} // %s' % domain.domain_name)
            sections.append(self.wrap_with_guard_for_condition(domain.condition, '\n'.join(domain_lines)))

        if len(sections) == 0:
            return ''

        return """// Versions.
%s
// End of versions.
""" % '\n\n'.join(sections)

    def _generate_forward_declarations(self, domains):
        sections = []

        for domain in domains:
            declaration_types = [decl.type for decl in self.type_declarations_for_domain(domain)]
            object_types = [_type for _type in declaration_types if isinstance(_type, ObjectType)]
            enum_types = [_type for _type in declaration_types if isinstance(_type, EnumType)]
            sorted(object_types, key=methodcaller('raw_name'))
            sorted(enum_types, key=methodcaller('raw_name'))

            if len(object_types) + len(enum_types) == 0:
                continue

            domain_lines = []
            domain_lines.append('namespace %s {' % domain.domain_name)

            # Forward-declare all classes so the type builders won't break if rearranged.
            domain_lines.extend(self.wrap_with_guard_for_condition(object_type.declaration().condition, 'class %s;' % object_type.raw_name()) for object_type in object_types)
            domain_lines.extend(self.wrap_with_guard_for_condition(enum_type.declaration().condition, 'enum class %s;' % enum_type.raw_name()) for enum_type in enum_types)
            domain_lines.append('} // %s' % domain.domain_name)
            sections.append(self.wrap_with_guard_for_condition(domain.condition, '\n'.join(domain_lines)))

        if len(sections) == 0:
            return ''
        else:
            return """// Forward declarations.
%s
// End of forward declarations.
""" % '\n\n'.join(sections)

    def _generate_typedefs(self, domains):
        sections = list(map(self._generate_typedefs_for_domain, domains))
        sections = [text for text in sections if len(text) > 0]

        if len(sections) == 0:
            return ''
        else:
            return """// Typedefs.
%s
// End of typedefs.""" % '\n\n'.join(sections)

    def _generate_typedefs_for_domain(self, domain):
        type_declarations = self.type_declarations_for_domain(domain)
        primitive_declarations = [decl for decl in type_declarations if isinstance(decl.type, AliasedType)]
        array_declarations = [decl for decl in type_declarations if isinstance(decl.type, ArrayType)]
        if len(primitive_declarations) == 0 and len(array_declarations) == 0:
            return ''

        sections = []
        for declaration in primitive_declarations:
            primitive_name = CppGenerator.cpp_name_for_primitive_type(declaration.type.aliased_type)
            typedef_lines = []
            if len(declaration.description) > 0:
                typedef_lines.append('/* %s */' % declaration.description)
            typedef_lines.append('using %s = %s;' % (declaration.type_name, primitive_name))
            sections.append(self.wrap_with_guard_for_condition(declaration.condition, '\n'.join(typedef_lines)))

        for declaration in array_declarations:
            element_type = CppGenerator.cpp_protocol_type_for_type(declaration.type.element_type)
            typedef_lines = []
            if len(declaration.description) > 0:
                typedef_lines.append('/* %s */' % declaration.description)
            typedef_lines.append('using %s = JSON::ArrayOf<%s>;' % (declaration.type_name, element_type))
            sections.append(self.wrap_with_guard_for_condition(declaration.condition, '\n'.join(typedef_lines)))

        lines = []
        lines.append('namespace %s {' % domain.domain_name)
        lines.append('\n'.join(sections))
        lines.append('} // %s' % domain.domain_name)
        return self.wrap_with_guard_for_condition(domain.condition, '\n'.join(lines))

    def _generate_enum_constant_value_conversion_methods(self):
        if not self.assigned_enum_values():
            return []

        return_type = 'String'
        return_type_with_export_macro = [return_type]
        export_macro = self.model().framework.setting('export_macro', None)
        if export_macro is not None:
            return_type_with_export_macro[:0] = [export_macro]

        lines = []
        lines.append('namespace %s {' % self.helpers_namespace())
        lines.append('\n'.join([
            '%s getEnumConstantValue(int code);' % ' '.join(return_type_with_export_macro),
            '',
            'template<typename T> %s getEnumConstantValue(T enumValue)' % return_type,
            '{',
            '    return getEnumConstantValue(static_cast<int>(enumValue));',
            '}',
        ]))
        lines.append('} // namespace %s' % self.helpers_namespace())
        return lines

    def _generate_builders_for_domain(self, domain):
        sections = []

        type_declarations = self.type_declarations_for_domain(domain)
        for type_declaration in type_declarations:
            if isinstance(type_declaration.type, EnumType):
                sections.append(self._generate_struct_for_enum_declaration(type_declaration))
            elif isinstance(type_declaration.type, ObjectType):
                sections.append(self._generate_class_for_object_declaration(type_declaration, domain))

        sections = [section for section in sections if len(section) > 0]
        if len(sections) == 0:
            return ''

        lines = []
        lines.append('namespace %s {' % domain.domain_name)
        lines.append('')
        lines.append('\n\n'.join(sections))
        lines.append('')
        lines.append('} // %s' % domain.domain_name)
        return self.wrap_with_guard_for_condition(domain.condition, '\n'.join(lines))

    def _generate_class_for_object_declaration(self, type_declaration, domain):
        enum_members = [member for member in type_declaration.type_members if isinstance(member.type, EnumType) and member.type.is_anonymous]
        required_members = [member for member in type_declaration.type_members if not member.is_optional]
        optional_members = [member for member in type_declaration.type_members if member.is_optional]
        object_name = type_declaration.type_name

        lines = []
        if len(type_declaration.description) > 0:
            lines.append('/* %s */' % type_declaration.description)
        base_class = 'JSON::Object'
        if not Generator.type_has_open_fields(type_declaration.type):
            base_class = base_class + 'Base'
        lines.append('class %s final : public %s {' % (object_name, base_class))
        lines.append('public:')
        for enum_member in enum_members:
            lines.append('    // Named after property name \'%s\' while generating %s.' % (enum_member.member_name, object_name))
            lines.append(self._generate_struct_for_anonymous_enum_member(enum_member))
            lines.append('')
        lines.append(self._generate_builder_state_enum(type_declaration))

        constructor_example = []
        constructor_example.append('     * Ref<%s> result = %s::create()' % (object_name, object_name))
        for member in required_members:
            constructor_example.append('     *     .set%s(...)' % ucfirst(member.member_name))
        constructor_example.append('     *     .release()')

        builder_args = {
            'objectType': object_name,
            'constructorExample': '\n'.join(constructor_example) + ';',
        }

        lines.append(Template(CppTemplates.ProtocolObjectBuilderDeclarationPrelude).substitute(None, **builder_args))
        for type_member in required_members:
            lines.append(self._generate_builder_setter_for_member(type_member, domain))
        lines.append(Template(CppTemplates.ProtocolObjectBuilderDeclarationPostlude).substitute(None, **builder_args))
        for member in optional_members:
            lines.append(self._generate_unchecked_setter_for_member(member, domain))

        lines.append('};')
        return self.wrap_with_guard_for_condition(type_declaration.condition, '\n'.join(lines))

    def _generate_struct_for_enum_declaration(self, enum_declaration):
        lines = []
        if len(enum_declaration.description):
            lines.append('/* %s */' % enum_declaration.description)
        lines.extend(self._generate_struct_for_enum_type(enum_declaration.type_name, enum_declaration.type))
        return self.wrap_with_guard_for_condition(enum_declaration.condition, '\n'.join(lines))

    def _generate_struct_for_anonymous_enum_member(self, enum_member):
        def apply_indentation(line):
            if line.startswith(('#', '/*', '*/', '//')) or len(line) == 0:
                return line
            else:
                return '    ' + line

        indented_lines = list(map(apply_indentation, self._generate_struct_for_enum_type(enum_member.member_name, enum_member.type)))
        return '\n'.join(indented_lines)

    def _generate_struct_for_enum_type(self, enum_name, enum_type):
        lines = []
        enum_name = ucfirst(enum_name)
        lines.append('enum class %s {' % enum_name)
        for enum_value in enum_type.enum_values():
            lines.append('    %s = %s,' % (Generator.stylized_name_for_enum_value(enum_value), self.encoding_for_enum_value(enum_value)))
        lines.append('}; // enum class %s' % enum_name)
        return lines  # The caller may want to adjust indentation, so don't join these lines.

    def _generate_builder_state_enum(self, type_declaration):
        lines = []
        required_members = [member for member in type_declaration.type_members if not member.is_optional]
        enum_values = []

        lines.append('    enum {')
        lines.append('        NoFieldsSet = 0,')
        for i in range(len(required_members)):
            enum_value = "%sSet" % ucfirst(required_members[i].member_name)
            enum_values.append(enum_value)
            lines.append('        %s = 1 << %d,' % (enum_value, i))
        if len(enum_values) > 0:
            lines.append('        AllFieldsSet = (%s)' % ' | '.join(enum_values))
        else:
            lines.append('        AllFieldsSet = 0')
        lines.append('    };')
        lines.append('')
        return '\n'.join(lines)

    def _generate_builder_setter_for_member(self, type_member, domain):
        member_name = 'in_' + type_member.member_name

        member_value = member_name
        if type_member.type.is_enum():
            member_value = 'Protocol::%s::getEnumConstantValue(%s)' % (self.helpers_namespace(), member_value)
        elif CppGenerator.should_move_argument(type_member.type, False):
            member_value = 'WTFMove(%s)' % member_value

        setter_args = {
            'camelName': ucfirst(type_member.member_name),
            'setter': CppGenerator.cpp_setter_method_for_type(type_member.type),
            'memberType': CppGenerator.cpp_type_for_type_member_argument(type_member.type, type_member.member_name),
            'memberKey': type_member.member_name,
            'memberName': member_name,
            'memberValue': member_value,
        }

        lines = []
        lines.append('')
        lines.append('        Builder<STATE | %(camelName)sSet>& set%(camelName)s(%(memberType)s %(memberName)s)' % setter_args)
        lines.append('        {')
        lines.append('            static_assert(!(STATE & %(camelName)sSet), "property %(memberKey)s already set");' % setter_args)
        lines.append('            m_result->%(setter)s("%(memberKey)s"_s, %(memberValue)s);' % setter_args)
        lines.append('            return castState<%(camelName)sSet>();' % setter_args)
        lines.append('        }')
        return '\n'.join(lines)

    def _generate_unchecked_setter_for_member(self, type_member, domain):
        member_name = 'in_opt_' + type_member.member_name

        member_value = member_name
        if type_member.type.is_enum():
            member_value = 'Protocol::%s::getEnumConstantValue(%s)' % (self.helpers_namespace(), member_value)
        elif CppGenerator.should_move_argument(type_member.type, False):
            member_value = 'WTFMove(%s)' % member_value

        setter_args = {
            'camelName': ucfirst(type_member.member_name),
            'setter': CppGenerator.cpp_setter_method_for_type(type_member.type),
            'memberKey': type_member.member_name,
            'memberName': member_name,
            'memberValue': member_value,
            'memberType': CppGenerator.cpp_type_for_type_member_argument(type_member.type, type_member.member_name),
        }

        lines = []
        lines.append('')
        lines.append('    void set%(camelName)s(%(memberType)s %(memberName)s)' % setter_args)
        lines.append('    {')
        lines.append('        JSON::ObjectBase::%(setter)s("%(memberKey)s"_s, %(memberValue)s);' % setter_args)
        lines.append('    }')
        return '\n'.join(lines)

    def _generate_forward_declarations_for_binding_traits(self, domains):
        # A list of (builder_type, needs_runtime_cast)
        type_arguments = []

        for domain in domains:
            type_declarations = self.type_declarations_for_domain(domain)
            declarations_to_generate = [decl for decl in type_declarations if self.type_needs_shape_assertions(decl.type)]

            for type_declaration in declarations_to_generate:
                if isinstance(type_declaration.type, ObjectType):
                    type_arguments.append((self.wrap_with_guard_for_condition(type_declaration.condition, CppGenerator.cpp_protocol_type_for_type(type_declaration.type)), Generator.type_needs_runtime_casts(type_declaration.type)))

                for type_member in type_declaration.type_members:
                    if isinstance(type_member.type, EnumType):
                        type_arguments.append((self.wrap_with_guard_for_condition(type_declaration.condition, CppGenerator.cpp_type_for_enum(type_member.type, '%s::%s' % (type_declaration.type_name, ucfirst(type_member.member_name)))), False))

        struct_keywords = ['struct']
        function_keywords = ['static void']
        export_macro = self.model().framework.setting('export_macro', None)
        if export_macro is not None:
            struct_keywords.append(export_macro)
            #function_keywords[1:1] = [export_macro]

        lines = []
        for argument in type_arguments:
            lines.append('template<> %s BindingTraits<%s> {' % (' '.join(struct_keywords), argument[0]))
            if argument[1]:
                lines.append('static Ref<%s> runtimeCast(Ref<JSON::Value>&& value);' % argument[0])
            lines.append('%s assertValueHasExpectedType(JSON::Value*);' % ' '.join(function_keywords))
            lines.append('};')
        return '\n'.join(lines)

    def _generate_declarations_for_enum_conversion_methods(self, domains):
        sections = []
        sections.append('\n'.join([
            'namespace %s {' % self.helpers_namespace(),
            '',
            'template<typename ProtocolEnumType>',
            'std::optional<ProtocolEnumType> parseEnumValueFromString(const String&);',
        ]))

        def return_type_with_export_macro(cpp_protocol_type):
            enum_return_type = 'std::optional<%s>' % cpp_protocol_type
            result_terms = [enum_return_type]
            export_macro = self.model().framework.setting('export_macro', None)
            if export_macro is not None:
                result_terms[:0] = [export_macro]
            return ' '.join(result_terms)

        def type_member_is_anonymous_enum_type(type_member):
            return isinstance(type_member.type, EnumType) and type_member.type.is_anonymous

        for domain in domains:
            type_declarations = self.type_declarations_for_domain(domain)
            declaration_types = [decl.type for decl in type_declarations]
            object_types = [_type for _type in declaration_types if isinstance(_type, ObjectType)]
            enum_types = [_type for _type in declaration_types if isinstance(_type, EnumType)]
            if len(object_types) + len(enum_types) == 0:
                continue

            sorted(object_types, key=methodcaller('raw_name'))
            sorted(enum_types, key=methodcaller('raw_name'))

            domain_lines = []
            domain_lines.append("// Enums in the '%s' Domain" % domain.domain_name)
            for enum_type in enum_types:
                cpp_protocol_type = CppGenerator.cpp_type_for_enum(enum_type, enum_type.raw_name())
                domain_lines.append(self.wrap_with_guard_for_condition(enum_type.declaration().condition, 'template<>\n%s parseEnumValueFromString<%s>(const String&);' % (return_type_with_export_macro(cpp_protocol_type), cpp_protocol_type)))

            for object_type in object_types:
                object_lines = []
                for enum_member in filter(type_member_is_anonymous_enum_type, object_type.members):
                    cpp_protocol_type = CppGenerator.cpp_type_for_enum(enum_member.type, '%s::%s' % (object_type.raw_name(), ucfirst(enum_member.member_name)))
                    object_lines.append('template<>\n%s parseEnumValueFromString<%s>(const String&);' % (return_type_with_export_macro(cpp_protocol_type), cpp_protocol_type))
                if len(object_lines):
                    domain_lines.append(self.wrap_with_guard_for_condition(object_type.declaration().condition, '\n'.join(object_lines)))

            if len(domain_lines) == 1:
                continue  # No real declarations to emit, just the domain comment. Skip.

            sections.append(self.wrap_with_guard_for_condition(domain.condition, '\n'.join(domain_lines)))

        if len(sections) == 1:
            return [] # No real sections to emit, just the namespace and template declaration. Skip.

        sections.append('} // namespace %s' % self.helpers_namespace())

        return ['\n\n'.join(sections)]

    def _generate_hash_declarations(self, domains):
        lines = []

        for domain in domains:
            type_declarations = self.type_declarations_for_domain(domain)
            declaration_types = [decl.type for decl in type_declarations]
            enum_types = list(filter(lambda _type: isinstance(_type, EnumType), declaration_types))

            if len(enum_types) == 0:
                continue

            if len(lines) == 0:
                lines.append('namespace WTF {')
                lines.append('')
                lines.append('template<typename T> struct DefaultHash;')

            domain_lines = []

            domain_lines.append('')
            domain_lines.append("// Hash declarations in the '%s' Domain" % domain.domain_name)

            for enum_type in enum_types:
                enum_lines = []
                enum_lines.append('template<>')
                enum_lines.append('struct DefaultHash<Inspector::Protocol::%s::%s> : IntHash<Inspector::Protocol::%s::%s> { };' % (domain.domain_name, enum_type.raw_name(), domain.domain_name, enum_type.raw_name()))
                domain_lines.append(self.wrap_with_guard_for_condition(enum_type.declaration().condition, '\n'.join(enum_lines)))

            lines.append(self.wrap_with_guard_for_condition(domain.condition, '\n'.join(domain_lines)))

        if len(lines) == 0:
            return []

        lines.append('')
        lines.append('} // namespace WTF')
        return ['\n'.join(lines)]
