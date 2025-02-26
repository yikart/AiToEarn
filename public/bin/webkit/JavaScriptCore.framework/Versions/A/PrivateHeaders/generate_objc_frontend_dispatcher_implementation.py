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
import string
from string import Template

try:
    from .cpp_generator import CppGenerator
    from .generator import Generator, ucfirst
    from .objc_generator import ObjCGenerator
    from .objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates
except ImportError:
    from cpp_generator import CppGenerator
    from generator import Generator, ucfirst
    from objc_generator import ObjCGenerator
    from objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates

log = logging.getLogger('global')


class ObjCFrontendDispatcherImplementationGenerator(ObjCGenerator):
    def __init__(self, *args, **kwargs):
        ObjCGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return '%sEventDispatchers.mm' % self.protocol_name()

    def domains_to_generate(self):
        return list(filter(self.should_generate_events_for_domain, Generator.domains_to_generate(self)))

    def generate_output(self):
        secondary_headers = [
            '"%sTypeConversions.h"' % self.protocol_name(),
            '<wtf/JSONValues.h>',
        ]

        header_args = {
            'primaryInclude': '"%sInternal.h"' % self.protocol_name(),
            'secondaryIncludes': '\n'.join(['#import %s' % header for header in secondary_headers]),
        }

        domains = self.domains_to_generate()
        sections = []
        sections.append(self.generate_license())
        sections.append(Template(ObjCTemplates.ImplementationPrelude).substitute(None, **header_args))
        sections.extend(list(map(self._generate_event_dispatcher_implementations, domains)))
        sections.append(Template(ObjCTemplates.ImplementationPostlude).substitute(None, **header_args))
        return '\n\n'.join(sections)

    def _generate_event_dispatcher_implementations(self, domain):
        if not self.should_generate_events_for_domain(domain):
            return ''

        lines = []
        objc_name = '%s%sDomainEventDispatcher' % (self.objc_prefix(), domain.domain_name)
        lines.append('@implementation %s' % objc_name)
        lines.append('{')
        lines.append('    AugmentableInspectorController* _controller;')
        lines.append('}')
        lines.append('')
        lines.append('- (instancetype)initWithController:(AugmentableInspectorController*)controller')
        lines.append('{')
        lines.append('    self = [super init];')
        lines.append('    if (!self)')
        lines.append('        return nil;')
        lines.append('    ASSERT(controller);')
        lines.append('    _controller = controller;')
        lines.append('    return self;')
        lines.append('}')
        lines.append('')
        for event in self.events_for_domain(domain):
            lines.append(self._generate_event(domain, event))
            lines.append('')
        lines.append('@end')
        return self.wrap_with_guard_for_condition(domain.condition, '\n'.join(lines))

    def _generate_event(self, domain, event):
        lines = []
        lines.append(self._generate_event_signature(domain, event))
        lines.append('{')
        lines.append('    const FrontendRouter& router = _controller->frontendRouter();')
        lines.append('')

        required_pointer_parameters = [parameter for parameter in event.event_parameters if not parameter.is_optional and ObjCGenerator.is_type_objc_pointer_type(parameter.type)]
        for parameter in required_pointer_parameters:
            var_name = ObjCGenerator.identifier_to_objc_identifier(parameter.parameter_name)
            lines.append('    THROW_EXCEPTION_FOR_REQUIRED_PARAMETER(%s, @"%s");' % (var_name, var_name))
            objc_array_class = self.objc_class_for_array_type(parameter.type)
            if objc_array_class and objc_array_class.startswith(self.objc_prefix()):
                lines.append('    THROW_EXCEPTION_FOR_BAD_TYPE_IN_ARRAY(%s, [%s class]);' % (var_name, objc_array_class))

        optional_pointer_parameters = [parameter for parameter in event.event_parameters if parameter.is_optional and ObjCGenerator.is_type_objc_pointer_type(parameter.type)]
        for parameter in optional_pointer_parameters:
            var_name = ObjCGenerator.identifier_to_objc_identifier(parameter.parameter_name)
            lines.append('    THROW_EXCEPTION_FOR_BAD_OPTIONAL_PARAMETER(%s, @"%s");' % (var_name, var_name))
            objc_array_class = self.objc_class_for_array_type(parameter.type)
            if objc_array_class and objc_array_class.startswith(self.objc_prefix()):
                lines.append('    THROW_EXCEPTION_FOR_BAD_TYPE_IN_OPTIONAL_ARRAY(%s, [%s class]);' % (var_name, objc_array_class))

        if required_pointer_parameters or optional_pointer_parameters:
            lines.append('')

        lines.append('    auto protocol_jsonMessage = JSON::Object::create();')
        lines.append('    protocol_jsonMessage->setString("method"_s, "%s.%s"_s);' % (domain.domain_name, event.event_name))
        if event.event_parameters:
            lines.extend(self._generate_event_out_parameters(domain, event))
        lines.append('    router.sendEvent(protocol_jsonMessage->toJSONString());')
        lines.append('}')
        return self.wrap_with_guard_for_condition(event.condition, '\n'.join(lines))

    def _generate_event_signature(self, domain, event):
        if not event.event_parameters:
            return '- (void)%s' % event.event_name
        pairs = []
        for parameter in event.event_parameters:
            param_name = parameter.parameter_name
            pairs.append('%s:(%s)%s' % (param_name, self.objc_type_for_param(domain, event.event_name, parameter), param_name))
        pairs[0] = ucfirst(pairs[0])
        return '- (void)%sWith%s' % (event.event_name, ' '.join(pairs))

    def _generate_event_out_parameters(self, domain, event):
        lines = []
        lines.append('    auto protocol_paramsObject = JSON::Object::create();')
        for parameter in event.event_parameters:
            keyed_set_method = CppGenerator.cpp_setter_method_for_type(parameter.type)
            var_name = parameter.parameter_name
            safe_var_name = '(*%s)' % var_name if parameter.is_optional else var_name
            export_expression = self.objc_protocol_export_expression_for_variable(parameter.type, safe_var_name)
            if not parameter.is_optional:
                lines.append('    protocol_paramsObject->%s("%s"_s, %s);' % (keyed_set_method, parameter.parameter_name, export_expression))
            else:
                lines.append('    if (%s)' % (parameter.parameter_name))
                lines.append('        protocol_paramsObject->%s("%s"_s, %s);' % (keyed_set_method, parameter.parameter_name, export_expression))
        lines.append('    protocol_jsonMessage->setObject("params"_s, WTFMove(protocol_paramsObject));')
        return lines
