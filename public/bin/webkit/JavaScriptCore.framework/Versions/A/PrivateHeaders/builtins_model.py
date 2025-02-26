#!/usr/bin/env python3
#
# Copyright (c) 2015-2016 Apple Inc. All rights reserved.
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
import os

from builtins_templates import BuiltinsGeneratorTemplates as Templates

log = logging.getLogger('global')

_FRAMEWORK_CONFIG_MAP = {
    "JavaScriptCore": {
        "macro_prefix": "JSC",
        "namespace": "JSC",
    },
    "WebCore": {
        "macro_prefix": "WEBCORE",
        "namespace": "WebCore",
    },
}

functionHeadRegExp = re.compile(r"(?:@[\w|=\[\] \"\.]+\s*\n)*(?:async\s+)?function\s+\w+\s*\(.*?\)", re.MULTILINE | re.DOTALL)
functionLinkTimeConstantRegExp = re.compile(r".*^@linkTimeConstant", re.MULTILINE | re.DOTALL)
functionAlwaysInlineRegExp = re.compile(r".*^@alwaysInline", re.MULTILINE | re.DOTALL)
functionVisibilityRegExp = re.compile(r".*^@visibility=(\w+)", re.MULTILINE | re.DOTALL)
functionNakedConstructorRegExp = re.compile(r".*^@nakedConstructor", re.MULTILINE | re.DOTALL)
functionIntrinsicRegExp = re.compile(r".*^@intrinsic=(\w+)", re.MULTILINE | re.DOTALL)
functionIsConstructorRegExp = re.compile(r".*^@constructor", re.MULTILINE | re.DOTALL)
functionIsGetterRegExp = re.compile(r".*^@getter", re.MULTILINE | re.DOTALL)
functionIsAsyncRegExp = re.compile(r".*^(async)?\s*function", re.MULTILINE | re.DOTALL)
functionNameRegExp = re.compile(r"function\s+(\w+)\s*\(", re.MULTILINE | re.DOTALL)
functionOverriddenNameRegExp = re.compile(r".*^@overriddenName=(\".+\")$", re.MULTILINE | re.DOTALL)
functionParameterFinder = re.compile(r"^(?:async\s+)?function\s+(?:\w+)\s*\(((?:\s*\w+)?\s*(?:\s*,\s*\w+)*)?\s*\)", re.MULTILINE | re.DOTALL)
functionParametersSplitter = re.compile(r",\s*(?![^{}]*\})", re.MULTILINE | re.DOTALL)

multilineCommentRegExp = re.compile(r"\/\*.*?\*\/", re.MULTILINE | re.DOTALL)
singleLineCommentRegExp = re.compile(r"\/\/.*?\n", re.MULTILINE | re.DOTALL)
keyValueAnnotationCommentRegExp = re.compile(r"^\/\/ @(\w+)=([^=]+?)\n", re.MULTILINE | re.DOTALL)
flagAnnotationCommentRegExp = re.compile(r"^\/\/ @(\w+)[^=]*?\n", re.MULTILINE | re.DOTALL)
lineWithOnlySingleLineCommentRegExp = re.compile(r"^\s*\/\/\n", re.MULTILINE | re.DOTALL)
lineWithTrailingSingleLineCommentRegExp = re.compile(r"\s*\/\/\n", re.MULTILINE | re.DOTALL)
leadingWhitespaceRegExp = re.compile(r"^ +", re.MULTILINE | re.DOTALL)
multipleEmptyLinesRegExp = re.compile(r"\n{2,}", re.MULTILINE | re.DOTALL)

class ParseException(Exception):
    pass


class Framework:
    def __init__(self, name):
        self._settings = _FRAMEWORK_CONFIG_MAP[name]
        self.name = name

    def setting(self, key, default=''):
        return self._settings.get(key, default)

    @staticmethod
    def fromString(frameworkString):
        if frameworkString == "JavaScriptCore":
            return Frameworks.JavaScriptCore

        if frameworkString == "WebCore":
            return Frameworks.WebCore

        raise ParseException("Unknown framework: %s" % frameworkString)


class Frameworks:
    JavaScriptCore = Framework("JavaScriptCore")
    WebCore = Framework("WebCore")


class BuiltinObject:
    def __init__(self, object_name, annotations, functions):
        self.object_name = object_name
        self.annotations = annotations
        self.functions = functions
        self.collection = None  # Set by the owning BuiltinsCollection

        for function in self.functions:
            function.object = self


class BuiltinFunction:
    def __init__(self, function_name, function_source, parameters, is_async, is_constructor, is_link_time_constant, is_naked_constructor, is_always_inline, intrinsic, visibility, overridden_name):
        self.function_name = function_name
        self.function_source = function_source
        self.parameters = parameters
        self.is_async = is_async
        self.is_constructor = is_constructor
        self.is_naked_constructor = is_naked_constructor
        self.is_always_inline = is_always_inline
        self.is_link_time_constant = is_link_time_constant
        self.intrinsic = intrinsic
        self.visibility = visibility
        self.overridden_name = overridden_name
        self.object = None  # Set by the owning BuiltinObject

    @staticmethod
    def fromString(function_string):
        function_source = multilineCommentRegExp.sub("", function_string)

        intrinsic = "NoIntrinsic"
        if "@intrinsic=" in function_source:
            intrinsicMatch = functionIntrinsicRegExp.search(function_source)
            if intrinsicMatch:
                intrinsic = intrinsicMatch.group(1)
                function_source = function_source.replace(intrinsicMatch.group(0), "")

        overridden_name = None
        if "@overriddenName=" in function_source:
            overriddenNameMatch = functionOverriddenNameRegExp.search(function_source)
            if overriddenNameMatch:
                overridden_name = overriddenNameMatch.group(1)
                function_source = function_source.replace(overriddenNameMatch.group(0), "")

        if not os.getenv("CONFIGURATION", "Debug").startswith("Debug"):
            function_source = lineWithOnlySingleLineCommentRegExp.sub("", function_source)
            function_source = lineWithTrailingSingleLineCommentRegExp.sub("\n", function_source)
            function_source = leadingWhitespaceRegExp.sub("", function_source)
            function_source = multipleEmptyLinesRegExp.sub("\n", function_source)

        function_name = functionNameRegExp.findall(function_source)[0]
        async_match = functionIsAsyncRegExp.match(function_source)
        is_async = async_match != None and async_match.group(1) == "async"
        is_constructor = functionIsConstructorRegExp.match(function_source) != None
        is_getter = functionIsGetterRegExp.match(function_source) != None
        is_link_time_constant = functionLinkTimeConstantRegExp.match(function_source) != None
        is_naked_constructor = functionNakedConstructorRegExp.match(function_source) != None
        is_always_inline = functionAlwaysInlineRegExp.match(function_source) != None
        if is_naked_constructor:
            is_constructor = True

        visibility = "Public"
        if "@visibility=" in function_source:
            visibilityMatch = functionVisibilityRegExp.search(function_source)
            if visibilityMatch:
                visibility = visibilityMatch.group(1)
                function_source = function_source.replace(visibilityMatch.group(1), "")
        elif is_link_time_constant:
            visibility = "Private"

        parameters = [s.strip() for s in functionParametersSplitter.split(functionParameterFinder.findall(function_source)[0])]
        if len(parameters[0]) == 0:
            parameters = []

        if is_getter and not overridden_name:
            overridden_name = "\"get %s\"_s" % (function_name)

        if not overridden_name:
            overridden_name = "ASCIILiteral()"

        if overridden_name[-1] == "\"":
            overridden_name += "_s"

        return BuiltinFunction(function_name, function_source, parameters, is_async, is_constructor, is_link_time_constant, is_naked_constructor, is_always_inline, intrinsic, visibility, overridden_name)

    def __str__(self):
        interface = "%s(%s)" % (self.function_name, ', '.join(self.parameters))
        if self.is_constructor:
            interface = interface + " [Constructor]"

        if self.is_async:
            interface = "async " + interface

        return interface

    def __lt__(self, other):
        return self.function_name < other.function_name


class BuiltinsCollection:
    def __init__(self, framework_name):
        self._copyright_lines = set()
        self.objects = []
        self.framework = Framework.fromString(framework_name)
        log.debug("Created new Builtins collection.")

    def parse_builtins_file(self, filename, text):
        log.debug("Parsing builtins file: %s" % filename)

        parsed_copyrights = set(self._parse_copyright_lines(text))
        self._copyright_lines = self._copyright_lines.union(parsed_copyrights)

        log.debug("Found copyright lines:")
        for line in self._copyright_lines:
            log.debug(line)
        log.debug("")

        object_annotations = self._parse_annotations(text)

        object_name, ext = os.path.splitext(os.path.basename(filename))
        log.debug("Parsing object: %s" % object_name)

        parsed_functions = self._parse_functions(text)
        for function in parsed_functions:
            function.object = object_name

        log.debug("Parsed functions:")
        for func in parsed_functions:
            log.debug(func)
        log.debug("")

        new_object = BuiltinObject(object_name, object_annotations, parsed_functions)
        new_object.collection = self
        self.objects.append(new_object)

    def copyrights(self):
        owner_to_years = dict()
        copyrightYearRegExp = re.compile(r"(\d{4})[, ]{0,2}")
        ownerStartRegExp = re.compile(r"[^\d, ]")

        # Returns deduplicated copyrights keyed on the owner.
        for line in self._copyright_lines:
            years = set(copyrightYearRegExp.findall(line))
            ownerIndex = ownerStartRegExp.search(line).start()
            owner = line[ownerIndex:]
            log.debug("Found years: %s and owner: %s" % (years, owner))
            if owner not in owner_to_years:
                owner_to_years[owner] = set()

            owner_to_years[owner] = owner_to_years[owner].union(years)

        result = []

        for owner, years in list(owner_to_years.items()):
            sorted_years = list(years)
            sorted_years.sort()
            result.append("%s %s" % (', '.join(sorted_years), owner))

        return result

    def all_functions(self):
        result = []
        for object in self.objects:
            result.extend(object.functions)

        result.sort()
        return result

    def all_internal_functions(self):
        result = []
        for object in [o for o in self.objects if 'internal' in o.annotations]:
            result.extend(object.functions)

        result.sort()
        return result

    # Private methods.

    def _parse_copyright_lines(self, text):
        licenseBlock = multilineCommentRegExp.findall(text)[0]
        licenseBlock = licenseBlock[:licenseBlock.index("Redistribution")]

        copyrightLines = [Templates.DefaultCopyright]
        for line in licenseBlock.split("\n"):
            line = line.replace("/*", "")
            line = line.replace("*/", "")
            line = line.replace("*", "")
            line = line.replace("Copyright", "")
            line = line.replace("copyright", "")
            line = line.replace("(C)", "")
            line = line.replace("(c)", "")
            line = line.strip()

            if len(line) == 0:
                continue

            copyrightLines.append(line)

        return copyrightLines

    def _parse_annotations(self, text):
        annotations = {}

        for match in keyValueAnnotationCommentRegExp.finditer(text):
            (key, value) = match.group(1, 2)
            log.debug("Found annotation: '%s' => '%s'" % (key, value))
            if key in annotations:
                raise ParseException("Duplicate annotation found: %s" % key)

            annotations[key] = value

        for match in flagAnnotationCommentRegExp.finditer(text):
            key = match.group(1)
            log.debug("Found annotation: '%s' => 'TRUE'" % key)
            if key in annotations:
                raise ParseException("Duplicate annotation found: %s" % key)

            annotations[key] = True

        return annotations

    def _parse_functions(self, text):
        text = multilineCommentRegExp.sub("/**/", singleLineCommentRegExp.sub("//\n", text))

        matches = [func for func in functionHeadRegExp.finditer(text)]
        functionBounds = []
        start = 0
        end = 0

        for match in matches:
            start = match.start()
            if start < end:
                continue
            end = match.end()
            while text[end] != '{':
                end += 1
            depth = 1
            isEscapingCharacter = False
            currentStringStartCharacter = None
            while depth > 0:
                end += 1
                currentCharacter = text[end]

                if isEscapingCharacter:
                    isEscapingCharacter = False
                    continue

                if currentCharacter in "`'\"":
                    if currentStringStartCharacter is None:
                        currentStringStartCharacter = currentCharacter
                    elif currentCharacter == currentStringStartCharacter:
                        currentStringStartCharacter = None
                    continue

                if currentCharacter == '\\' and currentStringStartCharacter is not None:
                    isEscapingCharacter = True
                    continue

                # FIXME: <webkit.org/b/239817> Regular expressions containing unbalanced quotation marks (like the one
                # found in `StringPrototype.js`'s `createHTML`) can confuse the state of tracking our being
                # inside/outside a string. To work around this, just reset our string state at the end of each line
                # (unless we are inside a template string). This will work unless a regular expression contains
                # unbalanced curly brackets or a closing curly bracket we care about is on the same line as the earlier
                # regular expression with an unbalanced quote.
                if currentCharacter == '\n' and currentStringStartCharacter != '`':
                    currentStringStartCharacter = None
                    continue

                if currentStringStartCharacter is not None:
                    continue

                if currentCharacter == '{':
                    depth += 1
                elif currentCharacter == '}':
                    depth -= 1

            end += 1
            functionBounds.append((start, end))

        functionStrings = [text[start:end].strip() for (start, end) in functionBounds]
        return list(map(BuiltinFunction.fromString, functionStrings))
