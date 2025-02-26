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

try:
    from .cpp_generator import CppGenerator
    from .cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from .generator import Generator, ucfirst
    from .models import ObjectType, ArrayType, AliasedType, EnumType
except ImportError:
    from cpp_generator import CppGenerator
    from cpp_generator_templates import CppGeneratorTemplates as CppTemplates
    from generator import Generator, ucfirst
    from models import ObjectType, ArrayType, AliasedType, EnumType

log = logging.getLogger('global')


class CppBackendDispatcherImplementationGenerator(CppGenerator):
    def __init__(self, *args, **kwargs):
        CppGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return "%sBackendDispatchers.cpp" % self.protocol_name()

    def domains_to_generate(self):
        return [domain for domain in Generator.domains_to_generate(self) if len(self.commands_for_domain(domain)) > 0]

    def generate_output(self):
        secondary_includes = self._generate_secondary_header_includes()

        if self.model().framework.setting('alternate_dispatchers', False):
            secondary_includes.append('')
            secondary_includes.append('#if ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)')
            secondary_includes.append('#include "%sAlternateBackendDispatchers.h"' % self.protocol_name())
            secondary_includes.append('#endif // ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)')

        header_args = {
            'primaryInclude': '"%sBackendDispatchers.h"' % self.protocol_name(),
            'secondaryIncludes': '\n'.join(secondary_includes),
        }

        sections = []
        sections.append(self.generate_license())
        sections.append(Template(CppTemplates.ImplementationPrelude).substitute(None, **header_args))
        sections.append("\n".join(map(self._generate_handler_class_destructor_for_domain, self.domains_to_generate())))
        sections.extend(list(map(self._generate_dispatcher_implementations_for_domain, self.domains_to_generate())))
        sections.append(Template(CppTemplates.ImplementationPostlude).substitute(None, **header_args))
        return "\n\n".join(sections)

    # Private methods.

    def _generate_secondary_header_includes(self):
        header_includes = [
            (["JavaScriptCore", "WebKit"], ("JavaScriptCore", "inspector/InspectorFrontendRouter.h")),
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/NeverDestroyed.h")),
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/text/MakeString.h")),
        ]
        return self.generate_includes_from_entries(header_includes)


    def _generate_handler_class_destructor_for_domain(self, domain):
        destructor_args = {
            'domainName': domain.domain_name
        }
        destructor = '%(domainName)sBackendDispatcherHandler::~%(domainName)sBackendDispatcherHandler() { }' % destructor_args
        return self.wrap_with_guard_for_condition(domain.condition, destructor)

    def _generate_dispatcher_implementations_for_domain(self, domain):
        implementations = []

        constructor_args = {
            'domainName': domain.domain_name,
        }
        implementations.append(Template(CppTemplates.BackendDispatcherImplementationDomainConstructor).substitute(None, **constructor_args))

        commands = self.commands_for_domain(domain)

        if len(commands) <= 5:
            implementations.append(self._generate_small_dispatcher_switch_implementation_for_domain(domain))
        else:
            implementations.append(self._generate_large_dispatcher_switch_implementation_for_domain(domain))

        for command in commands:
            if command.is_async:
                implementations.append(self._generate_async_dispatcher_class_for_domain(command, domain))
            implementations.append(self._generate_dispatcher_implementation_for_command(command, domain))

        return self.wrap_with_guard_for_condition(domain.condition, '\n\n'.join(implementations))

    def _generate_small_dispatcher_switch_implementation_for_domain(self, domain):
        commands = self.commands_for_domain(domain)

        cases = []

        first_command_string = "\n".join([
            '    if (protocol_method == "%s"_s) {' % commands[0].command_name,
            '        %s(protocol_requestId, WTFMove(protocol_parameters));' % commands[0].command_name,
            '        return;',
            '    }',
        ])
        cases.append(self.wrap_with_guard_for_condition(commands[0].condition, first_command_string))

        for command in commands[1:]:
            additional_command_string = "\n".join([
                '    if (protocol_method == "%s"_s) {' % command.command_name,
                '        %s(protocol_requestId, WTFMove(protocol_parameters));' % command.command_name,
                '        return;',
                '    }',
            ])
            cases.append(self.wrap_with_guard_for_condition(command.condition, additional_command_string))

        switch_args = {
            'domainName': domain.domain_name,
            'dispatchCases': "\n".join(cases)
        }

        return Template(CppTemplates.BackendDispatcherImplementationSmallSwitch).substitute(None, **switch_args)

    def _generate_large_dispatcher_switch_implementation_for_domain(self, domain):
        commands = self.commands_for_domain(domain)

        cases = []
        for command in commands:
            args = {
                'domainName': domain.domain_name,
                'commandName': command.command_name
            }
            cases.append(self.wrap_with_guard_for_condition(command.condition, '        { "%(commandName)s"_s, &%(domainName)sBackendDispatcher::%(commandName)s },' % args))

        switch_args = {
            'domainName': domain.domain_name,
            'dispatchCases': "\n".join(cases)
        }

        return Template(CppTemplates.BackendDispatcherImplementationLargeSwitch).substitute(None, **switch_args)

    def _generate_async_dispatcher_class_for_domain(self, command, domain):
        return_assignments = []
        callback_parameters = []

        for parameter in command.return_parameters:
            parameter_name = parameter.parameter_name
            if parameter.is_optional:
                parameter_name = 'opt_' + parameter_name

            parameter_value = parameter_name

            _type = parameter.type
            if isinstance(_type, AliasedType):
                _type = _type.aliased_type
            if isinstance(_type, EnumType) and _type.is_anonymous:
                _type = _type.primitive_type

            if _type.is_enum():
                if parameter.is_optional:
                    parameter_value = '*' + parameter_value
                parameter_value = 'Protocol::%s::getEnumConstantValue(%s)' % (self.helpers_namespace(), parameter_value)
            elif CppGenerator.should_release_argument(_type, parameter.is_optional):
                parameter_value = parameter_value + '.releaseNonNull()'
            elif CppGenerator.should_dereference_argument(_type, parameter.is_optional):
                parameter_value = '*' + parameter_value
            elif CppGenerator.should_move_argument(_type, parameter.is_optional):
                parameter_value = 'WTFMove(%s)' % parameter_value

            param_args = {
                'keyedSetMethod': CppGenerator.cpp_setter_method_for_type(_type),
                'parameterKey': parameter.parameter_name,
                'parameterName': parameter_name,
                'parameterValue': parameter_value,
            }

            callback_parameters.append('%s %s' % (CppGenerator.cpp_type_for_command_return_argument(_type, parameter.is_optional), parameter_name))

            if parameter.is_optional:
                return_assignments.append('    if (!!%(parameterName)s)' % param_args)
                return_assignments.append('        protocol_jsonMessage->%(keyedSetMethod)s("%(parameterKey)s"_s, %(parameterValue)s);' % param_args)
            else:
                return_assignments.append('    protocol_jsonMessage->%(keyedSetMethod)s("%(parameterKey)s"_s, %(parameterValue)s);' % param_args)

        async_args = {
            'domainName': domain.domain_name,
            'callbackName': ucfirst(command.command_name) + 'Callback',
            'callbackParameters': ", ".join(callback_parameters),
            'returnAssignments': "\n".join(return_assignments)
        }
        return self.wrap_with_guard_for_condition(command.condition, Template(CppTemplates.BackendDispatcherImplementationAsyncCommand).substitute(None, **async_args))

    def _generate_dispatcher_implementation_for_command(self, command, domain):
        parameter_declarations = []
        parameter_enum_resolutions = []
        alternate_dispatcher_method_parameters = ['protocol_requestId']
        method_parameters = []

        for parameter in command.call_parameters:
            parameter_name = parameter.parameter_name
            if parameter.is_optional:
                parameter_name = 'opt_' + parameter_name
            parameter_name = 'in_' + parameter_name

            variable_name = parameter_name

            _type = parameter.type
            if isinstance(_type, AliasedType):
                _type = _type.aliased_type
            if isinstance(_type, EnumType) and _type.is_anonymous:
                _type = _type.primitive_type

            if _type.is_enum():
                parameter_name = parameter_name + '_json'

                alternate_dispatcher_method_parameters.append(parameter_name)

                enum_args = {
                    'helpersNamespace': self.helpers_namespace(),
                    'parameterKey': parameter.parameter_name,
                    'enumType': CppGenerator.cpp_protocol_type_for_type(_type),
                    'enumVariableName': variable_name,
                    'stringVariableName': parameter_name,
                }

                if len(parameter_enum_resolutions):
                    parameter_enum_resolutions.append('')
                parameter_enum_resolutions.append('    auto %(enumVariableName)s = Protocol::%(helpersNamespace)s::parseEnumValueFromString<%(enumType)s>(%(stringVariableName)s);' % enum_args)
                if parameter.is_optional:
                    parameter_expression = 'WTFMove(%s)' % variable_name
                else:
                    parameter_enum_resolutions.append('    if (!%(enumVariableName)s) {' % enum_args)
                    parameter_enum_resolutions.append('        m_backendDispatcher->reportProtocolError(BackendDispatcher::ServerError, makeString("Unknown %(parameterKey)s: "_s, %(stringVariableName)s));' % enum_args)
                    parameter_enum_resolutions.append('        return;')
                    parameter_enum_resolutions.append('    }')
                    parameter_expression = '*' + variable_name
            else:
                if _type.raw_name() == 'string':
                    parameter_expression = variable_name
                elif parameter.is_optional:
                    parameter_expression = 'WTFMove(%s)' % variable_name
                elif _type.raw_name() in ['boolean', 'integer', 'number']:
                    parameter_expression = '*' + variable_name
                else:
                    parameter_expression = variable_name + '.releaseNonNull()'
                alternate_dispatcher_method_parameters.append(parameter_expression)
            method_parameters.append(parameter_expression)

            param_args = {
                'parameterKey': parameter.parameter_name,
                'parameterName': parameter_name,
                'keyedGetMethod': CppGenerator.cpp_getter_method_for_type(_type),
                'required': 'false' if parameter.is_optional else 'true',
            }
            parameter_declarations.append('    auto %(parameterName)s = m_backendDispatcher->%(keyedGetMethod)s(protocol_parameters.get(), "%(parameterKey)s"_s, %(required)s);' % param_args)

        if command.is_async:
            method_parameters.append('adoptRef(*new %sBackendDispatcherHandler::%s(m_backendDispatcher.copyRef(), protocol_requestId))' % (domain.domain_name, '%sCallback' % ucfirst(command.command_name)))

        command_args = {
            'domainName': domain.domain_name,
            'commandName': command.command_name,
            'parameterDeclarations': '\n'.join(parameter_declarations),
            'invocationParameters': ', '.join(method_parameters),
            'alternateInvocationParameters': ', '.join(alternate_dispatcher_method_parameters),
        }

        lines = []
        if len(command.call_parameters) == 0:
            lines.append('void %(domainName)sBackendDispatcher::%(commandName)s(long protocol_requestId, RefPtr<JSON::Object>&&)' % command_args)
        else:
            lines.append('void %(domainName)sBackendDispatcher::%(commandName)s(long protocol_requestId, RefPtr<JSON::Object>&& protocol_parameters)' % command_args)
        lines.append('{')

        if len(command.call_parameters) > 0:
            lines.append(Template(CppTemplates.BackendDispatcherImplementationPrepareCommandArguments).substitute(None, **command_args))

        if self.model().framework.setting('alternate_dispatchers', False):
            lines.append('#if ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)')
            lines.append('    if (m_alternateDispatcher) {')
            lines.append('        m_alternateDispatcher->%(commandName)s(%(alternateInvocationParameters)s);' % command_args)
            lines.append('        return;')
            lines.append('    }')
            lines.append('#endif // ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)')
            lines.append('')

        if len(parameter_enum_resolutions):
            lines.extend(parameter_enum_resolutions)
            lines.append('')

        if command.is_async:
            lines.append('    m_agent->%(commandName)s(%(invocationParameters)s);' % command_args)
        else:
            result_destructured_names = []
            result_conversion_lines = []
            for parameter in command.return_parameters:
                parameter_name = parameter.parameter_name
                if parameter.is_optional:
                    parameter_name = 'opt_' + parameter_name
                parameter_name = 'out_' + parameter_name

                result_destructured_names.append(parameter_name)

                parameter_value = parameter_name

                _type = parameter.type
                if isinstance(_type, AliasedType):
                    _type = _type.aliased_type
                if isinstance(_type, EnumType) and _type.is_anonymous:
                    _type = _type.primitive_type

                if _type.is_enum():
                    if parameter.is_optional:
                        parameter_value = '*' + parameter_value
                    parameter_value = 'Protocol::%s::getEnumConstantValue(%s)' % (self.helpers_namespace(), parameter_value)
                elif CppGenerator.should_release_argument(_type, parameter.is_optional):
                    parameter_value = parameter_value + '.releaseNonNull()'
                elif CppGenerator.should_dereference_argument(_type, parameter.is_optional):
                    parameter_value = '*' + parameter_value
                elif CppGenerator.should_move_argument(_type, parameter.is_optional):
                    parameter_value = 'WTFMove(%s)' % parameter_value

                param_args = {
                    'keyedSetMethod': CppGenerator.cpp_setter_method_for_type(_type),
                    'parameterKey': parameter.parameter_name,
                    'parameterName': parameter_name,
                    'parameterValue': parameter_value,
                }

                if parameter.is_optional:
                    result_conversion_lines.append('    if (!!%(parameterName)s)' % param_args)
                    result_conversion_lines.append('        protocol_jsonMessage->%(keyedSetMethod)s("%(parameterKey)s"_s, %(parameterValue)s);' % param_args)
                else:
                    result_conversion_lines.append('    protocol_jsonMessage->%(keyedSetMethod)s("%(parameterKey)s"_s, %(parameterValue)s);' % param_args)

            lines.append('    auto result = m_agent->%(commandName)s(%(invocationParameters)s);' % command_args)
            lines.append('    if (!result) {')
            lines.append('        ASSERT(!result.error().isEmpty());')
            lines.append('        m_backendDispatcher->reportProtocolError(BackendDispatcher::ServerError, result.error());')
            lines.append('        return;')
            lines.append('    }')
            lines.append('')
            if len(result_destructured_names) == 1:
                lines.append('    auto %s = WTFMove(result.value());' % result_destructured_names[0])
                lines.append('')
            elif len(result_destructured_names) > 1:
                lines.append('    auto [%s] = WTFMove(result.value());' % ", ".join(result_destructured_names))
                lines.append('')
            lines.append('    auto protocol_jsonMessage = JSON::Object::create();')
            lines.extend(result_conversion_lines)
            lines.append('    m_backendDispatcher->sendResponse(protocol_requestId, WTFMove(protocol_jsonMessage), false);')

        lines.append('}')
        return self.wrap_with_guard_for_condition(command.condition, "\n".join(lines))
