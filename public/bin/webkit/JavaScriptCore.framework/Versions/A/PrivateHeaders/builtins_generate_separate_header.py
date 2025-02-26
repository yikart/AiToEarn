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

from builtins_generator import BuiltinsGenerator
from builtins_model import Frameworks
from builtins_templates import BuiltinsGeneratorTemplates as Templates

log = logging.getLogger('global')


class BuiltinsSeparateHeaderGenerator(BuiltinsGenerator):
    def __init__(self, model, object):
        BuiltinsGenerator.__init__(self, model)
        self.object = object

    def output_filename(self):
        return "%sBuiltins.h" % BuiltinsGenerator.mangledNameForObject(self.object)

    def macro_prefix(self):
        return self.model().framework.setting('macro_prefix')

    def generate_output(self):
        args = {
            'namespace': self.model().framework.setting('namespace'),
            'macroPrefix': self.macro_prefix(),
            'objectName': self.object.object_name,
            'objectMacro': self.object.object_name.upper(),
        }

        conditional_guard = self.object.annotations.get('conditional')

        sections = []
        sections.append(self.generate_license())
        sections.append(Template(Templates.DoNotEditWarning).substitute(args))
        sections.append(Template(Templates.HeaderIncludeGuard).substitute(args))
        if conditional_guard is not None:
            sections.append("#if %s" % conditional_guard)
        sections.append(self.generate_secondary_header_includes())
        sections.append(self.generate_forward_declarations())
        sections.append(Template(Templates.NamespaceTop).substitute(args))
        sections.append(self.generate_section_for_object(self.object))
        sections.append(self.generate_section_for_code_table_macro())
        sections.append(self.generate_section_for_code_name_macro())
        sections.append(Template(Templates.SeparateHeaderStaticMacros).substitute(args))
        if self.model().framework is Frameworks.WebCore:
            sections.append(Template(Templates.SeparateHeaderWrapperBoilerplate).substitute(args))
            if self.object.annotations.get('internal'):
                sections.append(Template(Templates.SeparateHeaderInternalFunctionsBoilerplate).substitute(args))
        sections.append(Template(Templates.NamespaceBottom).substitute(args))
        if conditional_guard is not None:
            sections.append("#endif // %s" % conditional_guard)

        return "\n\n".join(sections)

    def generate_forward_declarations(self):
        return """namespace JSC {
class FunctionExecutable;
}"""

    def generate_secondary_header_includes(self):
        header_includes = [
            (["WebCore"],
                ("JavaScriptCore", "bytecode/UnlinkedFunctionExecutable.h"),
            ),

            (["WebCore"],
                ("JavaScriptCore", "builtins/BuiltinUtils.h"),
            ),

            (["WebCore"],
                ("JavaScriptCore", "runtime/Identifier.h"),
            ),

            (["WebCore"],
                ("JavaScriptCore", "runtime/JSFunction.h"),
            ),
        ]

        return '\n'.join(self.generate_includes_from_entries(header_includes))

    def generate_section_for_object(self, object):
        lines = []
        lines.append('/* %s */' % object.object_name)
        lines.extend(self.generate_externs_for_object(object))
        lines.append("")
        lines.extend(self.generate_macros_for_object(object))
        lines.append("")
        lines.extend(self.generate_defines_for_object(object))
        return '\n'.join(lines)

    def generate_externs_for_object(self, object):
        lines = []

        for function in object.functions:
            function_args = {
                'codeName': BuiltinsGenerator.mangledNameForFunction(function) + 'Code',
            }

            lines.append("""extern const char* const s_%(codeName)s;
extern const int s_%(codeName)sLength;
extern const JSC::ConstructAbility s_%(codeName)sConstructAbility;
extern const JSC::ConstructorKind s_%(codeName)sConstructorKind;
extern const JSC::ImplementationVisibility s_%(codeName)sImplementationVisibility;
extern const JSC::InlineAttribute s_%(codeName)sInlineAttribute;""" % function_args)

        return lines

    def generate_macros_for_object(self, object):
        args = {
            'macroPrefix': self.macro_prefix(),
            'objectMacro': object.object_name.replace('.', '_').upper(),
        }

        lines = []
        lines.append("#define %(macroPrefix)s_FOREACH_%(objectMacro)s_BUILTIN_DATA(macro) \\" % args)
        for function in object.functions:
            function_args = {
                'funcName': function.function_name,
                'mangledName': BuiltinsGenerator.mangledNameForFunction(function),
                'paramCount': len(function.parameters),
            }

            lines.append("    macro(%(funcName)s, %(mangledName)s, %(paramCount)d) \\" % function_args)
        return lines

    def generate_defines_for_object(self, object):
        lines = []
        for function in object.functions:
            args = {
                'macroPrefix': self.macro_prefix(),
                'objectMacro': object.object_name.replace('.', '_').upper(),
                'functionMacro': function.function_name.upper(),
            }
            lines.append("#define %(macroPrefix)s_BUILTIN_%(objectMacro)s_%(functionMacro)s 1" % args)

        return lines

    def generate_section_for_code_table_macro(self):
        args = {
            'macroPrefix': self.model().framework.setting('macro_prefix'),
            'objectMacro': self.object.object_name.upper(),
        }

        lines = []
        lines.append("#define %(macroPrefix)s_FOREACH_%(objectMacro)s_BUILTIN_CODE(macro) \\" % args)
        for function in self.object.functions:
            function_args = {
                'funcName': function.function_name,
                'overriddenName': function.overridden_name,
                'codeName': BuiltinsGenerator.mangledNameForFunction(function) + 'Code',
            }

            lines.append("    macro(%(codeName)s, %(funcName)s, %(overriddenName)s, s_%(codeName)sLength) \\" % function_args)
        return '\n'.join(lines)

    def generate_section_for_code_name_macro(self):
        args = {
            'macroPrefix': self.macro_prefix(),
            'objectMacro': self.object.object_name.upper(),
        }

        lines = []
        lines.append("#define %(macroPrefix)s_FOREACH_%(objectMacro)s_BUILTIN_FUNCTION_NAME(macro) \\" % args)
        unique_names = list(set([function.function_name for function in self.object.functions]))
        unique_names.sort()
        for function_name in unique_names:
            function_args = {
                'funcName': function_name,
            }

            lines.append("    macro(%(funcName)s) \\" % function_args)
        return '\n'.join(lines)
