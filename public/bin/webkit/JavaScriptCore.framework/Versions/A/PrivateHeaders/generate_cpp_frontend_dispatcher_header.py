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


class CppFrontendDispatcherHeaderGenerator(CppGenerator):
    def __init__(self, *args, **kwargs):
        CppGenerator.__init__(self, *args, **kwargs)

    def output_filename(self):
        return "%sFrontendDispatchers.h" % self.protocol_name()

    def domains_to_generate(self):
        return [domain for domain in Generator.domains_to_generate(self) if len(self.events_for_domain(domain)) > 0]

    def generate_output(self):
        header_args = {
            'includes': self._generate_secondary_header_includes(),
            'typedefs': 'class FrontendRouter;',
        }

        sections = []
        sections.append(self.generate_license())
        sections.append(Template(CppTemplates.HeaderPrelude).substitute(None, **header_args))
        sections.extend(list(map(self._generate_dispatcher_declarations_for_domain, self.domains_to_generate())))
        sections.append(Template(CppTemplates.HeaderPostlude).substitute(None, **header_args))
        return "\n\n".join(sections)

    # Private methods.

    def _generate_secondary_header_includes(self):
        header_includes = [
            (["JavaScriptCore", "WebKit"], (self.model().framework.name, "%sProtocolObjects.h" % self.protocol_name())),
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/JSONValues.h")),
            (["JavaScriptCore", "WebKit"], ("WTF", "wtf/text/WTFString.h")),
        ]
        return '\n'.join(self.generate_includes_from_entries(header_includes))

    def _generate_anonymous_enum_for_parameter(self, parameter, event):
        enum_args = {
            'parameterName': parameter.parameter_name,
            'eventName': event.event_name
        }

        lines = []
        lines.append('        // Named after parameter \'%(parameterName)s\' while generating command/event %(eventName)s.' % enum_args)
        lines.append('        enum class %s {' % ucfirst(parameter.parameter_name))
        for enum_value in parameter.type.enum_values():
            lines.append('            %s = %d,' % (Generator.stylized_name_for_enum_value(enum_value), self.encoding_for_enum_value(enum_value)))
        lines.append('        }; // enum class %s' % ucfirst(parameter.parameter_name))
        return "\n".join(lines)

    def _generate_dispatcher_declarations_for_domain(self, domain):
        classComponents = ['class']
        exportMacro = self.model().framework.setting('export_macro', None)
        if exportMacro is not None:
            classComponents.append(exportMacro)

        used_enum_names = set([])

        events = self.events_for_domain(domain)
        event_declarations = []
        for event in events:
            event_declarations.append(self._generate_dispatcher_declaration_for_event(event, domain, used_enum_names))

        handler_args = {
            'classAndExportMacro': " ".join(classComponents),
            'domainName': domain.domain_name,
            'eventDeclarations': "\n".join(event_declarations)
        }

        return self.wrap_with_guard_for_condition(domain.condition, Template(CppTemplates.FrontendDispatcherDomainDispatcherDeclaration).substitute(None, **handler_args))

    def _generate_dispatcher_declaration_for_event(self, event, domain, used_enum_names):
        formal_parameters = []
        lines = []
        for parameter in event.event_parameters:
            parameter_name = parameter.parameter_name
            if parameter.is_optional:
                parameter_name = 'opt_' + parameter_name

            formal_parameters.append('%s %s' % (CppGenerator.cpp_type_for_event_parameter(parameter.type, parameter.is_optional), parameter_name))

            if isinstance(parameter.type, EnumType) and parameter.type.is_anonymous and parameter.parameter_name not in used_enum_names:
                lines.append(self._generate_anonymous_enum_for_parameter(parameter, event))
                used_enum_names.add(parameter.parameter_name)

        lines.append("    void %s(%s);" % (event.event_name, ", ".join(formal_parameters)))
        return self.wrap_with_guard_for_condition(event.condition, "\n".join(lines))
