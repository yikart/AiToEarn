#!/usr/bin/env python3
#
# Copyright (c) 2014, 2016 Apple Inc. All rights reserved.
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

try:
    from .generator import Generator, ucfirst
    from .models import ObjectType, EnumType, Frameworks
    from .objc_generator import ObjCTypeCategory, ObjCGenerator
    from .objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates
except ImportError:
    from generator import Generator, ucfirst
    from models import ObjectType, EnumType, Frameworks
    from objc_generator import ObjCTypeCategory, ObjCGenerator
    from objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates

log = logging.getLogger('global')


def add_newline(lines):
    if not len(lines) or lines[-1] == '':
        return
    lines.append('')


class ObjCProtocolTypesImplementationGenerator(ObjCGenerator):
    def __init__(self, *args, **kwargs):
        ObjCGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return '%sTypes.mm' % self.protocol_name()

    def domains_to_generate(self):
        return list(filter(self.should_generate_types_for_domain, Generator.domains_to_generate(self)))

    def generate_output(self):
        secondary_headers = [
            '"%sTypeConversions.h"' % self.protocol_name(),
            Generator.string_for_file_include('%sJSONObjectPrivate.h' % ObjCGenerator.OBJC_STATIC_PREFIX, Frameworks.WebInspector, self.model().framework),
            '<wtf/Assertions.h>',
            '<wtf/JSONValues.h>',
        ]

        # The FooProtocolInternal.h header is only needed to declare the backend-side event dispatcher bindings.
        primaryIncludeName = self.protocol_name()
        if self.get_generator_setting('generate_backend', False):
            primaryIncludeName += 'Internal'

        header_args = {
            'primaryInclude': '"%s.h"' % primaryIncludeName,
            'secondaryIncludes': '\n'.join(['#import %s' % header for header in secondary_headers]),
        }

        domains = self.domains_to_generate()
        sections = []
        sections.append(self.generate_license())
        sections.append(Template(ObjCTemplates.ImplementationPrelude).substitute(None, **header_args))
        sections.extend(list(map(self.generate_type_implementations, domains)))
        sections.append(Template(ObjCTemplates.ImplementationPostlude).substitute(None, **header_args))
        return '\n\n'.join(sections)

    def generate_type_implementations(self, domain):
        lines = []
        for declaration in self.type_declarations_for_domain(domain):
            if (isinstance(declaration.type, ObjectType)):
                add_newline(lines)
                lines.append(self.generate_type_implementation(domain, declaration))
        return self.wrap_with_guard_for_condition(domain.condition, '\n'.join(lines))

    def generate_type_implementation(self, domain, declaration):
        lines = []
        lines.append('@implementation %s' % self.objc_name_for_type(declaration.type))
        # The initializer that takes a payload is only needed by the frontend.
        if self.get_generator_setting('generate_frontend', False):
            lines.append('')
            lines.append(self._generate_init_method_for_payload(domain, declaration))
            lines.append(self._generate_init_method_for_protocol_object(domain, declaration))
        required_members = [member for member in declaration.type_members if not member.is_optional]
        if required_members:
            lines.append('')
            lines.append(self._generate_init_method_for_required_members(domain, declaration, required_members))
        for member in declaration.type_members:
            lines.append('')
            lines.append(self._generate_setter_for_member(domain, declaration, member))
            lines.append('')
            lines.append(self._generate_getter_for_member(domain, declaration, member))
        lines.append('')
        lines.append('@end')
        return self.wrap_with_guard_for_condition(declaration.condition, '\n'.join(lines))

    def _generate_init_method_for_protocol_object(self, domain, declaration):
        lines = []
        lines.append('- (instancetype)initWithProtocolObject:(RWIProtocolJSONObject *)object')
        lines.append('{')
        lines.append('    if (!(self = [super initWithJSONObject:[object toJSONObject].get()]))')
        lines.append('        return nil;')
        lines.append('')
        lines.append('    return self;')
        lines.append('}')
        return '\n'.join(lines)

    def _generate_init_method_for_payload(self, domain, declaration):
        lines = []
        lines.append('- (instancetype)initWithPayload:(nonnull NSDictionary<NSString *, id> *)payload')
        lines.append('{')
        lines.append('    if (!(self = [super init]))')
        lines.append('        return nil;')
        lines.append('')

        for member in declaration.type_members:
            member_name = member.member_name

            if not member.is_optional:
                lines.append('    THROW_EXCEPTION_FOR_REQUIRED_PROPERTY(payload[@"%s"], @"%s");' % (member_name, member_name))

            objc_type = self.objc_type_for_member(declaration, member)
            var_name = ObjCGenerator.identifier_to_objc_identifier(member_name)
            conversion_expression = self.payload_to_objc_expression_for_member(declaration, member)
            if isinstance(member.type, EnumType):
                if not member.is_optional:
                    lines.append('    auto %s = %s;' % (var_name, conversion_expression))
                    lines.append('    THROW_EXCEPTION_FOR_BAD_ENUM_VALUE(%s, @"%s");' % (var_name, member_name))
                    lines.append('    self.%s = *%s;' % (var_name, var_name))
                else:
                    lines.append('    if (auto %s = %s)' % (var_name, conversion_expression))
                    lines.append('        self.%s = *%s;' % (var_name, var_name))
            else:
                lines.append('    self.%s = %s;' % (var_name, conversion_expression))

            lines.append('')

        lines.append('    return self;')
        lines.append('}')
        return '\n'.join(lines)

    def _generate_init_method_for_required_members(self, domain, declaration, required_members):
        pairs = []
        for member in required_members:
            objc_type = self.objc_type_for_member(declaration, member)
            var_name = ObjCGenerator.identifier_to_objc_identifier(member.member_name)
            pairs.append('%s:(%s)%s' % (var_name, objc_type, var_name))
        pairs[0] = ucfirst(pairs[0])
        lines = []
        lines.append('- (instancetype)initWith%s' % ' '.join(pairs))
        lines.append('{')
        lines.append('    if (!(self = [super init]))')
        lines.append('        return nil;')
        lines.append('')

        required_pointer_members = [member for member in required_members if ObjCGenerator.is_type_objc_pointer_type(member.type)]
        if required_pointer_members:
            for member in required_pointer_members:
                var_name = ObjCGenerator.identifier_to_objc_identifier(member.member_name)
                lines.append('    THROW_EXCEPTION_FOR_REQUIRED_PROPERTY(%s, @"%s");' % (var_name, var_name))
                objc_array_class = self.objc_class_for_array_type(member.type)
                if objc_array_class and objc_array_class.startswith(self.objc_prefix()):
                    lines.append('    THROW_EXCEPTION_FOR_BAD_TYPE_IN_ARRAY(%s, [%s class]);' % (var_name, objc_array_class))
            lines.append('')

        for member in required_members:
            var_name = ObjCGenerator.identifier_to_objc_identifier(member.member_name)
            lines.append('    self.%s = %s;' % (var_name, var_name))

        lines.append('')
        lines.append('    return self;')
        lines.append('}')
        return '\n'.join(lines)

    def _generate_setter_for_member(self, domain, declaration, member):
        objc_type = self.objc_type_for_member(declaration, member)
        var_name = ObjCGenerator.identifier_to_objc_identifier(member.member_name)
        setter_method = ObjCGenerator.objc_setter_method_for_member(declaration, member)
        conversion_expression = self.objc_to_protocol_expression_for_member(declaration, member, var_name)
        lines = []
        lines.append('- (void)set%s:(%s)%s' % (ucfirst(var_name), objc_type, var_name))
        lines.append('{')
        objc_array_class = self.objc_class_for_array_type(member.type)
        if objc_array_class and objc_array_class.startswith(self.objc_prefix()):
            lines.append('    THROW_EXCEPTION_FOR_BAD_TYPE_IN_ARRAY(%s, [%s class]);' % (var_name, objc_array_class))
        lines.append('    [super %s:%s forKey:@"%s"];' % (setter_method, conversion_expression, member.member_name))
        lines.append('}')
        return '\n'.join(lines)

    def _generate_getter_for_member(self, domain, declaration, member):
        objc_type = self.objc_type_for_member(declaration, member)
        var_name = ObjCGenerator.identifier_to_objc_identifier(member.member_name)
        getter_method = ObjCGenerator.objc_getter_method_for_member(declaration, member)
        basic_expression = '[super %s:@"%s"]' % (getter_method, member.member_name)
        category = ObjCTypeCategory.category_for_type(member.type)
        if category is ObjCTypeCategory.Object:
            lines = []
            lines.append('- (%s)%s' % (objc_type, var_name))
            lines.append('{')
            lines.append(self.protocol_to_objc_code_block_for_object_member(declaration, member, basic_expression))
            lines.append('}')
        else:
            conversion_expression = self.protocol_to_objc_expression_for_member(declaration, member, basic_expression)
            lines = []
            lines.append('- (%s)%s' % (objc_type, var_name))
            lines.append('{')
            lines.append('    return %s;' % conversion_expression)
            lines.append('}')
        return '\n'.join(lines)
