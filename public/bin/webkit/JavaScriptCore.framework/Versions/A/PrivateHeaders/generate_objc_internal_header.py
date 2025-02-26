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
    from .objc_generator import ObjCGenerator
    from .objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates
except ImportError:
    from generator import Generator, ucfirst
    from objc_generator import ObjCGenerator
    from objc_generator_templates import ObjCGeneratorTemplates as ObjCTemplates

log = logging.getLogger('global')


class ObjCInternalHeaderGenerator(ObjCGenerator):
    def __init__(self, *args, **kwargs):
        ObjCGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return '%sInternal.h' % self.protocol_name()

    def generate_output(self):
        headers = set([
            '"%s.h"' % self.protocol_name(),
            '"%sJSONObjectPrivate.h"' % self.protocol_name(),
            '<JavaScriptCore/AugmentableInspectorController.h>',
            '<wtf/JSONValues.h>',
        ])

        header_args = {
            'includes': '\n'.join(['#import ' + header for header in sorted(headers)]),
        }

        event_domains = list(filter(self.should_generate_events_for_domain, self.domains_to_generate()))

        sections = []
        sections.append(self.generate_license())
        sections.append(Template(ObjCTemplates.GenericHeaderPrelude).substitute(None, **header_args))
        sections.append('\n\n'.join([_f for _f in map(self._generate_event_dispatcher_private_interfaces, event_domains) if _f]))
        sections.append(Template(ObjCTemplates.GenericHeaderPostlude).substitute(None, **header_args))
        return '\n\n'.join(sections)

    def _generate_event_dispatcher_private_interfaces(self, domain):
        if not len(self.events_for_domain(domain)):
            return ''

        lines = []
        lines.append('@interface %s%sDomainEventDispatcher (Private)' % (self.objc_prefix(), domain.domain_name))
        lines.append('- (instancetype)initWithController:(Inspector::AugmentableInspectorController*)controller;')
        lines.append('@end')
        return self.wrap_with_guard_for_condition(domain.condition, '\n'.join(lines))
