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
import re
from string import Template

try:
    from .cpp_generator import CppGenerator
    from .cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from .models import EnumType, AliasedType
except ImportError:
    from cpp_generator import CppGenerator
    from cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from models import EnumType, AliasedType

log = logging.getLogger('global')


class CppAlternateBackendDispatcherHeaderGenerator(CppGenerator):
    def __init__(self, *args, **kwargs):
        CppGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return '%sAlternateBackendDispatchers.h' % self.protocol_name()

    def generate_output(self):
        template_args = {
            'includes': self._generate_secondary_header_includes()
        }

        domains = self.domains_to_generate()
        sections = []
        sections.append(self.generate_license())
        sections.append(Template(CppTemplates.AlternateDispatchersHeaderPrelude).substitute(None, **template_args))
        sections.append('\n\n'.join([_f for _f in map(self._generate_handler_declarations_for_domain, domains) if _f]))
        sections.append(Template(CppTemplates.AlternateDispatchersHeaderPostlude).substitute(None, **template_args))
        return '\n\n'.join(sections)

    # Private methods.

    def _generate_secondary_header_includes(self):
        target_framework_name = self.model().framework.name
        header_includes = [
            ([target_framework_name], (target_framework_name, "%sProtocolObjects.h" % self.protocol_name())),
            (["JavaScriptCore"], ("JavaScriptCore", "inspector/InspectorFrontendRouter.h")),
            (["JavaScriptCore"], ("JavaScriptCore", "inspector/InspectorBackendDispatcher.h")),
        ]

        return '\n'.join(self.generate_includes_from_entries(header_includes))

    def _generate_handler_declarations_for_domain(self, domain):
        commands = self.commands_for_domain(domain)

        if not len(commands):
            return ''

        command_declarations = []
        for command in commands:
            command_declarations.append(self._generate_handler_declaration_for_command(command))

        handler_args = {
            'domainName': domain.domain_name,
            'commandDeclarations': '\n'.join(command_declarations),
        }

        return self.wrap_with_guard_for_condition(domain.condition, Template(CppTemplates.AlternateBackendDispatcherHeaderDomainHandlerInterfaceDeclaration).substitute(None, **handler_args))

    def _generate_handler_declaration_for_command(self, command):
        lines = []
        parameters = ['long protocol_requestId']
        for parameter in command.call_parameters:
            parameter_type = parameter.type
            if isinstance(parameter_type, AliasedType):
                parameter_type = parameter_type.aliased_type
            if isinstance(parameter_type, EnumType):
                parameter_type = parameter_type.primitive_type

            parameter_name = parameter.parameter_name
            if parameter.is_optional:
                parameter_name = 'opt_' + parameter_name

            parameters.append('%s %s' % (CppGenerator.cpp_type_for_command_parameter(parameter_type, parameter.is_optional), parameter_name))

        command_args = {
            'commandName': command.command_name,
            'parameters': ', '.join(parameters),
        }
        lines.append('    virtual void %(commandName)s(%(parameters)s) = 0;' % command_args)
        return self.wrap_with_guard_for_condition(command.condition, '\n'.join(lines))
