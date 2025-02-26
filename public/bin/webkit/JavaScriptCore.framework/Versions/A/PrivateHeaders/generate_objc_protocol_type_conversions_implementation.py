#!/usr/bin/env python3
#
# Copyright (c) 2016 Apple Inc. All rights reserved.
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
    from .generator import Generator
    from .models import EnumType, ObjectType, ArrayType, AliasedType, PrimitiveType, Frameworks
    from .objc_generator import ObjCGenerator
    from .objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates
except ImportError:
    from generator import Generator
    from models import EnumType, ObjectType, ArrayType, AliasedType, PrimitiveType, Frameworks
    from objc_generator import ObjCGenerator
    from objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates

log = logging.getLogger('global')


def add_newline(lines):
    if not len(lines) or lines[-1] == '':
        return
    lines.append('')


class ObjCProtocolTypeConversionsImplementationGenerator(ObjCGenerator):
    def __init__(self, *args, **kwargs):
        ObjCGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return '%sTypeConversions.mm' % self.protocol_name()

    def domains_to_generate(self):
        return list(filter(self.should_generate_types_for_domain, Generator.domains_to_generate(self)))

    def generate_output(self):
        secondary_headers = [
            '"%s.h"' % self.protocol_name(),
            '"%sTypeParser.h"' % self.protocol_name(),
            Generator.string_for_file_include('%sJSONObjectPrivate.h' % ObjCGenerator.OBJC_STATIC_PREFIX, Frameworks.WebInspector, self.model().framework),
        ]
        secondary_headers.sort()

        header_args = {
            'primaryInclude': '"%sTypeConversions.h"' % self.protocol_name(),
            'secondaryIncludes': '\n'.join(['#import ' + header for header in secondary_headers]),
        }

        domains = self.domains_to_generate()
        sections = []
        sections.append(self.generate_license())
        sections.append(Template(ObjCTemplates.ImplementationPrelude).substitute(None, **header_args))
        sections.append(self._generate_type_factory_category_interface(domains))
        sections.append(self._generate_type_factory_category_implementation(domains))
        sections.append(Template(ObjCTemplates.ImplementationPostlude).substitute(None, **header_args))
        return '\n\n'.join(sections)

    def _generate_type_factory_category_interface(self, domains):
        lines = []
        for domain in domains:
            domain_lines = []
            domain_lines.append('@interface %sTypeConversions (%sDomain)' % (self.protocol_name(), domain.domain_name))
            add_newline(domain_lines)

            for declaration in self.type_declarations_for_domain(domain):
                domain_lines.append(self._generate_type_factory_method_declaration(domain, declaration))

            add_newline(domain_lines)
            domain_lines.append('@end')
            lines.append(self.wrap_with_guard_for_condition(domain.condition, '\n'.join(domain_lines)))
        return '\n'.join(lines)

    def _generate_type_factory_method_declaration(self, domain, declaration):
        resolved_type = declaration.type
        if isinstance(resolved_type, AliasedType):
            resolved_type = resolved_type.aliased_type
        if isinstance(resolved_type, (ObjectType, ArrayType, PrimitiveType)):
            objc_type = self.objc_class_for_type(resolved_type)
            return self.wrap_with_guard_for_condition(declaration.condition, '+ (void)_parse%s:(%s **)outValue fromPayload:(id)payload;' % (declaration.type.raw_name(), objc_type))
        if isinstance(resolved_type, EnumType):
            return self.wrap_with_guard_for_condition(declaration.condition, '+ (void)_parse%s:(NSNumber **)outValue fromPayload:(id)payload;' % declaration.type.raw_name())

    def _generate_type_factory_category_implementation(self, domains):
        lines = []
        for domain in domains:
            domain_lines = []
            domain_lines.append('@implementation %sTypeConversions (%sDomain)' % (self.protocol_name(), domain.domain_name))
            add_newline(domain_lines)

            for declaration in self.type_declarations_for_domain(domain):
                domain_lines.append(self._generate_type_factory_method_implementation(domain, declaration))
                add_newline(domain_lines)

            domain_lines.append('@end')
            lines.append(self.wrap_with_guard_for_condition(domain.condition, '\n'.join(domain_lines)))
        return '\n'.join(lines)

    def _generate_type_factory_method_implementation(self, domain, declaration):
        lines = []
        resolved_type = declaration.type
        if isinstance(resolved_type, AliasedType):
            resolved_type = resolved_type.aliased_type

        objc_class = self.objc_class_for_type(resolved_type)
        if isinstance(resolved_type, (ObjectType, ArrayType, PrimitiveType)):
            lines.append('+ (void)_parse%s:(%s **)outValue fromPayload:(id)payload' % (declaration.type.raw_name(), objc_class))
        if isinstance(resolved_type, EnumType):
            lines.append('+ (void)_parse%s:(NSNumber **)outValue fromPayload:(id)payload' % declaration.type.raw_name())

        lines.append('{')
        if isinstance(resolved_type, EnumType):
            lines.append('    THROW_EXCEPTION_FOR_BAD_TYPE(payload, [NSString class]);')
            lines.append('    auto result = Inspector::fromProtocolString<%(type)s>((__bridge CFStringRef)payload);' % {'type': self.objc_name_for_type(resolved_type)})
            lines.append('    THROW_EXCEPTION_FOR_BAD_ENUM_VALUE(result, @"%s");' % declaration.type.raw_name())
            lines.append('    *outValue = @(result.value());')
        elif isinstance(resolved_type, (ArrayType, PrimitiveType)):
            lines.append('    THROW_EXCEPTION_FOR_BAD_TYPE(payload, [%s class]);' % objc_class)
            lines.append('    *outValue = (%s *)payload;' % objc_class)
        elif isinstance(resolved_type, ObjectType):
            lines.append('    THROW_EXCEPTION_FOR_BAD_TYPE(payload, [NSDictionary class]);')
            lines.append('    *outValue = [[%s alloc] initWithPayload:payload];' % (objc_class))
        lines.append('}')
        return self.wrap_with_guard_for_condition(declaration.condition, '\n'.join(lines))
