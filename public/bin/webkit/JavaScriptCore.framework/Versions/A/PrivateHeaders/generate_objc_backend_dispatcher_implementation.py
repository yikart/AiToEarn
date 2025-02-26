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
import re
from string import Template

try:
    from .cpp_generator import CppGenerator
    from .generator import Generator
    from .models import PrimitiveType, EnumType, AliasedType, Frameworks
    from .objc_generator import ObjCTypeCategory, ObjCGenerator, join_type_and_name
    from .objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates
except ImportError:
    from cpp_generator import CppGenerator
    from generator import Generator
    from models import PrimitiveType, EnumType, AliasedType, Frameworks
    from objc_generator import ObjCTypeCategory, ObjCGenerator, join_type_and_name
    from objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates

log = logging.getLogger('global')


class ObjCBackendDispatcherImplementationGenerator(ObjCGenerator):
    def __init__(self, *args, **kwargs):
        ObjCGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return '%sBackendDispatchers.mm' % self.protocol_name()

    def domains_to_generate(self):
        return list(filter(self.should_generate_commands_for_domain, Generator.domains_to_generate(self)))

    def generate_output(self):
        secondary_headers = [
            '"%sInternal.h"' % self.protocol_name(),
            '"%sTypeConversions.h"' % self.protocol_name(),
            '<wtf/JSONValues.h>',
        ]

        header_args = {
            'primaryInclude': '"%sBackendDispatchers.h"' % self.protocol_name(),
            'secondaryIncludes': '\n'.join(['#include %s' % header for header in secondary_headers]),
        }

        domains = self.domains_to_generate()
        sections = []
        sections.append(self.generate_license())
        sections.append(Template(ObjCTemplates.BackendDispatcherImplementationPrelude).substitute(None, **header_args))
        sections.extend(list(map(self._generate_handler_implementation_for_domain, domains)))
        sections.append(Template(ObjCTemplates.BackendDispatcherImplementationPostlude).substitute(None, **header_args))
        return '\n\n'.join(sections)

    def _generate_handler_implementation_for_domain(self, domain):
        commands = self.commands_for_domain(domain)

        if not commands:
            return ''

        command_declarations = []
        for command in commands:
            command_declarations.append(self._generate_handler_implementation_for_command(domain, command))

        return self.wrap_with_guard_for_condition(domain.condition, '\n\n'.join(command_declarations))

    def _generate_handler_implementation_for_command(self, domain, command):
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
            parameter_name = 'in_' + parameter_name

            parameters.append('%s %s' % (CppGenerator.cpp_type_for_command_parameter(parameter_type, parameter.is_optional), parameter_name))

        command_args = {
            'domainName': domain.domain_name,
            'commandName': command.command_name,
            'parameters': ', '.join(parameters),
            'respondsToSelector': self._generate_responds_to_selector_for_command(domain, command),
            'successCallback': self._generate_success_block_for_command(domain, command),
            'conversions': self._generate_conversions_for_command(domain, command),
            'invocation': self._generate_invocation_for_command(domain, command),
        }

        return self.wrap_with_guard_for_condition(command.condition, Template(ObjCTemplates.BackendDispatcherHeaderDomainHandlerImplementation).substitute(None, **command_args))

    def _generate_responds_to_selector_for_command(self, domain, command):
        return '[m_delegate respondsToSelector:@selector(%sWithErrorCallback:successCallback:%s)]' % (command.command_name, ''.join(map(lambda parameter: '%s:' % parameter.parameter_name, command.call_parameters)))

    def _generate_success_block_for_command(self, domain, command):
        lines = []

        if command.return_parameters:
            success_block_parameters = []
            for parameter in command.return_parameters:
                out_param_name = parameter.parameter_name
                if parameter.is_optional:
                    out_param_name = 'opt_' + out_param_name
                out_param_name = 'out_' + out_param_name
                objc_type = self.objc_type_for_param(domain, command.command_name, parameter)
                success_block_parameters.append(join_type_and_name(objc_type, out_param_name))
            lines.append('    id successCallback = ^(%s) {' % ', '.join(success_block_parameters))
        else:
            lines.append('    id successCallback = ^{')

        lines.append('        auto protocol_jsonMessage = JSON::Object::create();')
        if command.return_parameters:
            required_pointer_parameters = [parameter for parameter in command.return_parameters if not parameter.is_optional and ObjCGenerator.is_type_objc_pointer_type(parameter.type)]
            for parameter in required_pointer_parameters:
                out_param_name = parameter.parameter_name
                if parameter.is_optional:
                    out_param_name = 'opt_' + out_param_name
                out_param_name = 'out_' + out_param_name
                lines.append('        THROW_EXCEPTION_FOR_REQUIRED_PARAMETER(%s, @"%s");' % (out_param_name, parameter.parameter_name))
                objc_array_class = self.objc_class_for_array_type(parameter.type)
                if objc_array_class and objc_array_class.startswith(self.objc_prefix()):
                    lines.append('        THROW_EXCEPTION_FOR_BAD_TYPE_IN_ARRAY(%s, [%s class]);' % (out_param_name, objc_array_class))

            optional_pointer_parameters = [parameter for parameter in command.return_parameters if parameter.is_optional and ObjCGenerator.is_type_objc_pointer_type(parameter.type)]
            for parameter in optional_pointer_parameters:
                out_param_name = parameter.parameter_name
                if parameter.is_optional:
                    out_param_name = 'opt_' + out_param_name
                out_param_name = 'out_' + out_param_name
                lines.append('        THROW_EXCEPTION_FOR_BAD_OPTIONAL_PARAMETER(%s, @"%s");' % (out_param_name, parameter.parameter_name))
                objc_array_class = self.objc_class_for_array_type(parameter.type)
                if objc_array_class and objc_array_class.startswith(self.objc_prefix()):
                    lines.append('        THROW_EXCEPTION_FOR_BAD_TYPE_IN_OPTIONAL_ARRAY(%s, [%s class]);' % (out_param_name, objc_array_class))

            for parameter in command.return_parameters:
                out_param_name = parameter.parameter_name
                if parameter.is_optional:
                    out_param_name = 'opt_' + out_param_name
                out_param_name = 'out_' + out_param_name
                keyed_set_method = CppGenerator.cpp_setter_method_for_type(parameter.type)
                var_expression = '*%s' % out_param_name if parameter.is_optional else out_param_name
                export_expression = self.objc_protocol_export_expression_for_variable(parameter.type, var_expression)
                if not parameter.is_optional:
                    lines.append('        protocol_jsonMessage->%s("%s"_s, %s);' % (keyed_set_method, parameter.parameter_name, export_expression))
                else:
                    lines.append('        if (!!%s)' % out_param_name)
                    lines.append('            protocol_jsonMessage->%s("%s"_s, %s);' % (keyed_set_method, parameter.parameter_name, export_expression))
        lines.append('        backendDispatcher()->sendResponse(protocol_requestId, WTFMove(protocol_jsonMessage), false);')

        lines.append('    };')
        return '\n'.join(lines)

    def _generate_conversions_for_command(self, domain, command):
        lines = []
        if command.call_parameters:
            lines.append('')

        def in_param_expression(param_name, parameter):
            _type = parameter.type
            if isinstance(_type, AliasedType):
                _type = _type.aliased_type
            if isinstance(_type, EnumType):
                _type = _type.primitive_type

            if _type.is_enum():
                if parameter.is_optional:
                    param_name = '*' + param_name
                return 'Protocol::Helpers::getEnumConstantValue(%s)' % param_name
            if CppGenerator.should_release_argument(_type, parameter.is_optional):
                return param_name + '.releaseNonNull()'
            if CppGenerator.should_dereference_argument(_type, parameter.is_optional):
                return '*' + param_name
            if CppGenerator.should_move_argument(_type, parameter.is_optional):
                return 'WTFMove(%s)' % param_name
            return param_name

        for parameter in command.call_parameters:
            in_param_name = parameter.parameter_name
            if parameter.is_optional:
                in_param_name = 'opt_' + in_param_name
            in_param_name = 'in_' + in_param_name
            objc_in_param_name = 'o_%s' % in_param_name
            objc_type = self.objc_type_for_param(domain, command.command_name, parameter, False)
            if isinstance(parameter.type, EnumType):
                objc_type = 'std::optional<%s>' % objc_type
            param_expression = in_param_expression(in_param_name, parameter)
            import_expression = self.objc_protocol_import_expression_for_parameter(param_expression, domain, command.command_name, parameter)
            if not parameter.is_optional:
                lines.append('    %s = %s;' % (join_type_and_name(objc_type, objc_in_param_name), import_expression))

                if isinstance(parameter.type, EnumType):
                    lines.append('    if (!%s) {' % objc_in_param_name)
                    lines.append('        backendDispatcher()->reportProtocolError(BackendDispatcher::InvalidParams, "Parameter \'%s\' of method \'%s.%s\' cannot be processed"_s);' % (parameter.parameter_name, domain.domain_name, command.command_name))
                    lines.append('        return;')
                    lines.append('    }')

            else:
                lines.append('    %s;' % join_type_and_name(objc_type, objc_in_param_name))
                lines.append('    if (!!%s)' % in_param_name)
                lines.append('        %s = %s;' % (objc_in_param_name, import_expression))
        return '\n'.join(lines)

    def _generate_invocation_for_command(self, domain, command):
        pairs = []
        pairs.append('WithErrorCallback:errorCallback')
        pairs.append('successCallback:successCallback')
        for parameter in command.call_parameters:
            in_param_name = parameter.parameter_name
            if parameter.is_optional:
                in_param_name = 'opt_' + in_param_name
            in_param_name = 'in_' + in_param_name
            objc_in_param_expression = 'o_%s' % in_param_name
            if not parameter.is_optional:
                if isinstance(parameter.type, EnumType):
                    objc_in_param_expression = '%s.value()' % objc_in_param_expression

                pairs.append('%s:%s' % (parameter.parameter_name, objc_in_param_expression))
            else:
                if isinstance(parameter.type, EnumType):
                    objc_in_param_expression = '%s.value()' % objc_in_param_expression

                optional_expression = '(!!%s ? &%s : nil)' % (in_param_name, objc_in_param_expression)
                pairs.append('%s:%s' % (parameter.parameter_name, optional_expression))
        return '    [m_delegate %s%s];' % (command.command_name, ' '.join(pairs))
