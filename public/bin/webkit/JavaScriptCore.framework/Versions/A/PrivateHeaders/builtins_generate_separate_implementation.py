#!/usr/bin/env python3
#
# Copyright (c) 2014, 2015 Apple Inc. All rights reserved.
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

from builtins_generator import BuiltinsGenerator, WK_lcfirst
from builtins_model import Framework, Frameworks
from builtins_templates import BuiltinsGeneratorTemplates as Templates

log = logging.getLogger('global')


class BuiltinsSeparateImplementationGenerator(BuiltinsGenerator):
    def __init__(self, model, object):
        BuiltinsGenerator.__init__(self, model)
        self.object = object

    def output_filename(self):
        return "%sBuiltins.cpp" % BuiltinsGenerator.mangledNameForObject(self.object)

    def macro_prefix(self):
        return self.model().framework.setting('macro_prefix')

    def generate_output(self):
        args = {
            'namespace': self.model().framework.setting('namespace'),
            'macroPrefix': self.macro_prefix(),
            'objectMacro': self.object.object_name.upper(),
            'objectNameLC': WK_lcfirst(self.object.object_name),
        }

        conditional_guard = self.object.annotations.get('conditional')

        sections = []
        sections.append(self.generate_license())
        sections.append(Template(Templates.DoNotEditWarning).substitute(args))
        sections.append(self.generate_primary_header_includes())
        if conditional_guard is not None:
            sections.append("#if %s" % conditional_guard)
        sections.append(self.generate_secondary_header_includes())
        sections.append(Template(Templates.NamespaceTop).substitute(args))
        for function in self.object.functions:
            sections.append(self.generate_embedded_code_string_section_for_data(self.generate_embedded_code_data_for_function(function)))
        if self.model().framework is Frameworks.JavaScriptCore:
            sections.append(Template(Templates.SeparateJSCImplementationStaticMacros).substitute(args))
        elif self.model().framework is Frameworks.WebCore:
            sections.append(Template(Templates.SeparateWebCoreImplementationStaticMacros).substitute(args))
        sections.append(Template(Templates.NamespaceBottom).substitute(args))
        if conditional_guard is not None:
            sections.append("#endif // %s\n" % conditional_guard)

        return "\n\n".join(sections)

    def generate_secondary_header_includes(self):
        header_includes = [
            (["JavaScriptCore"],
                ("JavaScriptCore", "builtins/BuiltinExecutables.h"),
            ),
            (["JavaScriptCore"],
                ("JavaScriptCore", "runtime/JSCellInlines.h"),
            ),
            (["WebCore"],
                ("JavaScriptCore", "runtime/JSObjectInlines.h"),
            ),
            (["JavaScriptCore", "WebCore"],
                ("JavaScriptCore", "runtime/VM.h"),
            ),
            (["WebCore"],
                ("WebCore", "bindings/js/WebCoreJSClientData.h"),
            ),
            (["JavaScriptCore", "WebCore"],
                ("JavaScriptCore", "runtime/IdentifierInlines.h"),
            ),
            (["JavaScriptCore", "WebCore"],
                ("JavaScriptCore", "runtime/ImplementationVisibility.h"),
            ),
            (["JavaScriptCore", "WebCore"],
                ("JavaScriptCore", "runtime/Intrinsic.h"),
            ),
        ]

        return '\n'.join(self.generate_includes_from_entries(header_includes))
