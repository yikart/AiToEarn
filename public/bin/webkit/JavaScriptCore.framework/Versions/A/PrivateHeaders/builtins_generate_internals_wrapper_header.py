#!/usr/bin/env python3
#
# Copyright (c) 2016-2021 Apple Inc. All rights reserved.
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
from string import Template

from builtins_generator import BuiltinsGenerator, WK_lcfirst, WK_ucfirst
from builtins_templates import BuiltinsGeneratorTemplates as Templates

log = logging.getLogger('global')


class BuiltinsInternalsWrapperHeaderGenerator(BuiltinsGenerator):
    def __init__(self, model):
        BuiltinsGenerator.__init__(self, model)
        self.internals = [object for object in model.objects if 'internal' in object.annotations]

    def output_filename(self):
        return "%sJSBuiltinInternals.h" % self.model().framework.setting('namespace')

    def generate_output(self):
        args = {
            'namespace': self.model().framework.setting('namespace'),
        }

        sections = []
        sections.append(self.generate_license())
        sections.append(Template(Templates.DoNotEditWarning).substitute(args))
        sections.append(Template(Templates.HeaderIncludeGuard).substitute(args))
        sections.append(self.generate_secondary_header_includes())

        sections.append(Template(Templates.NamespaceTop).substitute(args))
        sections.append(self.generate_section_for_object())
        sections.append(Template(Templates.NamespaceBottom).substitute(args))

        return "\n\n".join(sections)

    def generate_secondary_header_includes(self):
        header_includes = [
            (["WebCore"], ("JavaScriptCore", "heap/WeakInlines.h")),
            (["WebCore"], ("JavaScriptCore", "runtime/VM.h"))
        ]
        for object in self.internals:
            header_includes.append((["WebCore"], ("WebCore", object.object_name + "Builtins.h")))

        return '\n'.join(self.generate_includes_from_entries(header_includes))

    def generate_section_for_object(self):
        lines = ["class JSDOMGlobalObject;",
                 "",
                 "class JSBuiltinInternalFunctions {",
                 "public:"]

        lines.append("    explicit JSBuiltinInternalFunctions(JSC::VM&);")
        lines.append(self.generate_methods())
        lines.append(self.generate_accessors())
        lines.append("private:")
        lines.append(self.generate_members())
        lines.append("};")
        return '\n'.join(lines)

    def accessor_name(self, object):
        return WK_lcfirst(object.object_name)

    def member_name(self, object):
        return "m_" + self.accessor_name(object)

    def member_type(self, object):
        return WK_ucfirst(object.object_name) + "BuiltinFunctions"

    def generate_methods(self):
        return """
    template<typename Visitor> void visit(Visitor&);
    void initialize(JSDOMGlobalObject&);
"""

    def generate_accessors(self):
        lines = []
        for object in self.internals:
            accessor = "    %s& %s() { return %s; }" % (self.member_type(object), self.accessor_name(object), self.member_name(object))
            lines.append(BuiltinsGenerator.wrap_with_guard(object.annotations.get('conditional'), accessor))
        lines.append("")
        return '\n'.join(lines)

    def generate_members(self):
        lines = ["    JSC::VM& m_vm;"]
        for object in self.internals:
            member = "    %s %s;" % (self.member_type(object), self.member_name(object))
            lines.append(BuiltinsGenerator.wrap_with_guard(object.annotations.get('conditional'), member))
        return '\n'.join(lines)
