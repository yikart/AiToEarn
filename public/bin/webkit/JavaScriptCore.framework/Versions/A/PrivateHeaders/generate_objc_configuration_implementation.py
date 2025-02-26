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
    from .generator import Generator
    from .objc_generator import ObjCGenerator
    from .objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates
except ImportError:
    from generator import Generator
    from objc_generator import ObjCGenerator
    from objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates

log = logging.getLogger('global')


class ObjCConfigurationImplementationGenerator(ObjCGenerator):
    def __init__(self, *args, **kwargs):
        ObjCGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return '%sConfiguration.mm' % self.protocol_name()

    def generate_output(self):
        secondary_headers = [
            '"%sInternal.h"' % self.protocol_name(),
            '"%sBackendDispatchers.h"' % self.protocol_name(),
            '<JavaScriptCore/AlternateDispatchableAgent.h>',
            '<JavaScriptCore/AugmentableInspectorController.h>',
            '<JavaScriptCore/InspectorAlternateBackendDispatchers.h>',
            '<JavaScriptCore/InspectorBackendDispatchers.h>',
        ]

        header_args = {
            'primaryInclude': '"%sConfiguration.h"' % self.protocol_name(),
            'secondaryIncludes': '\n'.join(['#import %s' % header for header in secondary_headers]),
        }

        domains = self.domains_to_generate()
        sections = []
        sections.append(self.generate_license())
        sections.append(Template(ObjCTemplates.ImplementationPrelude).substitute(None, **header_args))
        sections.append(self._generate_configuration_implementation_for_domains(domains))
        sections.append(Template(ObjCTemplates.ImplementationPostlude).substitute(None, **header_args))
        return '\n\n'.join(sections)

    def _generate_configuration_implementation_for_domains(self, domains):
        lines = []
        lines.append('@implementation %sConfiguration' % self.protocol_name())
        lines.append('{')
        lines.append('    AugmentableInspectorController* _controller;')
        lines.extend(self._generate_ivars(domains))
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
        for domain in domains:
            domain_lines = []
            if self.should_generate_commands_for_domain(domain):
                domain_lines.append(self._generate_handler_setter_for_domain(domain))
                domain_lines.append('')
            if self.should_generate_events_for_domain(domain):
                domain_lines.append(self._generate_event_dispatcher_getter_for_domain(domain))
                domain_lines.append('')
            if len(domain_lines):
                lines.append(self.wrap_with_guard_for_condition(domain.condition, '\n'.join(domain_lines)))
        lines.append('@end')
        return '\n'.join(lines)

    def _generate_ivars(self, domains):
        lines = []
        for domain in domains:
            domain_lines = []
            if self.should_generate_commands_for_domain(domain):
                objc_class_name = '%s%sDomainHandler' % (self.objc_prefix(), domain.domain_name)
                ivar_name = '_%sHandler' % ObjCGenerator.variable_name_prefix_for_domain(domain)
                domain_lines.append('    RetainPtr<id<%s>> %s;' % (objc_class_name, ivar_name))
            if self.should_generate_events_for_domain(domain):
                objc_class_name = '%s%sDomainEventDispatcher' % (self.objc_prefix(), domain.domain_name)
                ivar_name = '_%sEventDispatcher' % ObjCGenerator.variable_name_prefix_for_domain(domain)
                domain_lines.append('    RetainPtr<%s> %s;' % (objc_class_name, ivar_name))
            if len(domain_lines):
                lines.append(self.wrap_with_guard_for_condition(domain.condition, '\n'.join(domain_lines)))
        return lines

    def _generate_handler_setter_for_domain(self, domain):
        setter_args = {
            'objcPrefix': self.objc_prefix(),
            'domainName': domain.domain_name,
            'variableNamePrefix': ObjCGenerator.variable_name_prefix_for_domain(domain),
        }
        return Template(ObjCTemplates.ConfigurationCommandPropertyImplementation).substitute(None, **setter_args)

    def _generate_event_dispatcher_getter_for_domain(self, domain):
        getter_args = {
            'objcPrefix': self.objc_prefix(),
            'domainName': domain.domain_name,
            'variableNamePrefix': ObjCGenerator.variable_name_prefix_for_domain(domain),
        }
        return Template(ObjCTemplates.ConfigurationGetterImplementation).substitute(None, **getter_args)
