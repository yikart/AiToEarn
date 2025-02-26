#!/usr/bin/env python3
#
# Copyright (c) 2014-2016 Apple Inc. All rights reserved.
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
from string import Template

try:
    from .cpp_generator import CppGenerator
    from .cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from .generator import Generator, ucfirst
    from .models import EnumType
except ImportError:
    from cpp_generator import CppGenerator
    from cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from generator import Generator, ucfirst
    from models import EnumType

log = logging.getLogger('global')


class CppBackendDispatcherHeaderGenerator(CppGenerator):
    def __init__(self, *args, **kwargs):
        CppGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return "%sBackendDispatchers.h" % self.protocol_name()

    def domains_to_generate(self):
        return [domain for domain in Generator.domains_to_generate(self) if len(self.commands_for_domain(domain)) > 0]

    def generate_output(self):
        header_args = {
            'includes': self._generate_secondary_header_includes(),
            'typedefs': '',
        }

        domains = self.domains_to_generate()

        sections = []
        sections.append(self.generate_license())
        sections.append(Template(CppTemplates.HeaderPrelude).substitute(None, **header_args))
        if self.model().framework.setting('alternate_dispatchers', False):
            sections.append(self._generate_alternate_handler_forward_declarations_for_domains(domains))
        sections.extend(list(map(self._generate_handler_declarations_for_domain, domains)))
        sections.extend(list(map(self._generate_dispatcher_declarations_for_domain, domains)))
        sections.append(Template(CppTemplates.HeaderPostlude).substitute(None, **header_args))
        return "\n\n".join(sections)

    # Private methods.

    def _generate_secondary_header_includes(self):
        header_includes = [
            (["JavaScriptCore", "WebKit"], (self.model().framework.name, "%sProtocolObjects.h" % self.protocol_name())),
            (["JavaScriptCore", "WebKit"], ("JavaScriptCore", "inspector/InspectorBackendDispatcher.h")),
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/Expected.h")),
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/text/MakeString.h")),
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/text/WTFString.h")),
            (["JavaScriptCore", "WebKit"], ("std", "tuple")),
        ]
        return '\n'.join(self.generate_includes_from_entries(header_includes))

    def _generate_alternate_handler_forward_declarations_for_domains(self, domains):
        if not domains:
            return ''

        lines = []
        lines.append('#if ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)')
        for domain in domains:
            lines.append(self.wrap_with_guard_for_condition(domain.condition, 'class Alternate%sBackendDispatcher;' % domain.domain_name))
        lines.append('#endif // ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)')
        return '\n'.join(lines)

    def _generate_handler_declarations_for_domain(self, domain):
        classComponents = ['class']
        exportMacro = self.model().framework.setting('export_macro', None)
        if exportMacro is not None:
            classComponents.append(exportMacro)

        command_declarations = []
        for command in self.commands_for_domain(domain):
            command_declarations.append(self._generate_handler_declaration_for_command(command))

        handler_args = {
            'classAndExportMacro': " ".join(classComponents),
            'domainName': domain.domain_name,
            'commandDeclarations': "\n".join(command_declarations)
        }

        return self.wrap_with_guard_for_condition(domain.condition, Template(CppTemplates.BackendDispatcherHeaderDomainHandlerDeclaration).substitute(None, **handler_args))

    def _generate_handler_declaration_for_command(self, command):
        if command.is_async:
            return self._generate_async_handler_declaration_for_command(command)

        lines = []

        parameters = []
        for parameter in command.call_parameters:
            parameter_name = parameter.parameter_name
            if parameter.is_optional:
                parameter_name = 'opt_' + parameter_name
            parameters.append("%s %s" % (CppGenerator.cpp_type_for_command_parameter(parameter.type, parameter.is_optional), parameter_name))

        returns = []
        for parameter in command.return_parameters:
            parameter_name = parameter.parameter_name
            if parameter.is_optional:
                parameter_name = 'opt_' + parameter_name
            returns.append('%s /* %s */' % (CppGenerator.cpp_type_for_command_return_declaration(parameter.type, parameter.is_optional), parameter_name))

        command_args = {
            'commandName': command.command_name,
            'parameters': ", ".join(parameters),
            'returns': ", ".join(returns),
        }
        if len(returns) == 1:
            lines.append('    virtual Protocol::ErrorStringOr<%(returns)s> %(commandName)s(%(parameters)s) = 0;' % command_args)
        elif len(returns) > 1:
            lines.append('    virtual Protocol::ErrorStringOr<std::tuple<%(returns)s>> %(commandName)s(%(parameters)s) = 0;' % command_args)
        else:
            lines.append('    virtual Protocol::ErrorStringOr<void> %(commandName)s(%(parameters)s) = 0;' % command_args)
        return self.wrap_with_guard_for_condition(command.condition, '\n'.join(lines))

    def _generate_async_handler_declaration_for_command(self, command):
        callbackName = "%sCallback" % ucfirst(command.command_name)

        parameters = []
        for parameter in command.call_parameters:
            parameter_name = parameter.parameter_name
            if parameter.is_optional:
                parameter_name = 'opt_' + parameter_name
            parameters.append("%s %s" % (CppGenerator.cpp_type_for_command_parameter(parameter.type, parameter.is_optional), parameter_name))
        parameters.append("Ref<%s>&&" % callbackName)

        returns = []
        for parameter in command.return_parameters:
            parameter_name = parameter.parameter_name
            if parameter.is_optional:
                parameter_name = 'opt_' + parameter_name
            returns.append("%s %s" % (CppGenerator.cpp_type_for_command_return_argument(parameter.type, parameter.is_optional), parameter_name))

        class_components = ['class']
        export_macro = self.model().framework.setting('export_macro', None)
        if export_macro:
            class_components.append(export_macro)

        command_args = {
            'classAndExportMacro': ' '.join(class_components),
            'callbackName': callbackName,
            'commandName': command.command_name,
            'parameters': ", ".join(parameters),
            'returns': ", ".join(returns),
        }

        return self.wrap_with_guard_for_condition(command.condition, Template(CppTemplates.BackendDispatcherHeaderAsyncCommandDeclaration).substitute(None, **command_args))

    def _generate_dispatcher_declarations_for_domain(self, domain):
        classComponents = ['class']
        exportMacro = self.model().framework.setting('export_macro', None)
        if exportMacro is not None:
            classComponents.append(exportMacro)

        declarations = []
        commands = self.commands_for_domain(domain)
        if len(commands) > 0:
            declarations.append('private:')
        declarations.extend(list(map(self._generate_dispatcher_declaration_for_command, commands)))

        declaration_args = {
            'domainName': domain.domain_name,
        }

        # Add in a few more declarations at the end if needed.
        if self.model().framework.setting('alternate_dispatchers', False):
            declarations.append(Template(CppTemplates.BackendDispatcherHeaderDomainDispatcherAlternatesDeclaration).substitute(None, **declaration_args))

        handler_args = {
            'classAndExportMacro': " ".join(classComponents),
            'domainName': domain.domain_name,
            'commandDeclarations': "\n".join(declarations)
        }

        return self.wrap_with_guard_for_condition(domain.condition, Template(CppTemplates.BackendDispatcherHeaderDomainDispatcherDeclaration).substitute(None, **handler_args))

    def _generate_dispatcher_declaration_for_command(self, command):
        return self.wrap_with_guard_for_condition(command.condition, "    void %s(long protocol_requestId, RefPtr<JSON::Object>&& protocol_parameters);" % command.command_name)
