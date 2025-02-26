#!/usr/bin/env python3
# Copyright (C) 2014 Apple Inc. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
# 1.  Redistributions of source code must retain the above copyright
#     notice, this list of conditions and the following disclaimer.
# 2.  Redistributions in binary form must reproduce the above copyright
#     notice, this list of conditions and the following disclaimer in the
#     documentation and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
# EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
# ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

from __future__ import print_function
import io
import os
from optparse import OptionParser
from jsmin import jsmin


def stringifyCodepoint(code):
    if code < 128:
        return '{0:d}'.format(code)
    else:
        return "'\\x{0:02x}'".format(code)


def chunk(list, chunkSize):
    for i in range(0, len(list), chunkSize):
        yield list[i:i + chunkSize]


def main():
    parser = OptionParser(usage="usage: %prog [options] header source [input [input...]]")
    parser.add_option('--no-minify', action='store_true', help='Do not run the input files through jsmin')
    parser.add_option('--fail-if-non-ascii', action='store_true', help='Fail if the input files include non-ASCII characters')
    parser.add_option('-n', '--namespace', help='Namespace to use')
    (options, arguments) = parser.parse_args()
    if not options.namespace:
        print('Error: must provide a namespace')
        parser.print_usage()
        exit(-1)
    if len(arguments) < 3:
        print('Error: must provide at least 3 arguments')
        parser.print_usage()
        exit(-1)

    namespace = options.namespace
    headerPath = arguments[0]
    sourcePath = arguments[1]
    inputPaths = arguments[2:]

    headerFile = open(headerPath, 'w')
    print('namespace {0:s} {{'.format(namespace), file=headerFile)

    sourceFile = open(sourcePath, 'w')
    print('#include "{0:s}"'.format(os.path.basename(headerPath)), file=sourceFile)
    print('namespace {0:s} {{'.format(namespace), file=sourceFile)

    for inputFileName in inputPaths:
        variableName = os.path.splitext(os.path.basename(inputFileName))[0]
        sourceURLDirective = "//# sourceURL=__InjectedScript_" + variableName + ".js\n"

        inputStream = io.open(inputFileName, encoding='utf-8')

        data = inputStream.read()

        if not options.no_minify:
            characters = sourceURLDirective + jsmin(data)
        else:
            characters = sourceURLDirective + data

        if options.fail_if_non_ascii:
            for character in characters:
                if ord(character) >= 128:
                    raise Exception("%s is not ASCII" % character)

        codepoints = bytearray(characters, encoding='utf-8')

        # Use the size of codepoints instead of the characters
        # because UTF-8 characters may need more than one byte.
        size = len(codepoints)

        print('extern const char {0:s}JavaScript[{1:d}];'.format(variableName, size), file=headerFile)
        print('const char {0:s}JavaScript[{1:d}] = {{'.format(variableName, size), file=sourceFile)

        for codepointChunk in chunk(codepoints, 16):
            print('    {0:s},'.format(','.join(map(stringifyCodepoint, codepointChunk))), file=sourceFile)

        print('};', file=sourceFile)

    print('}} // namespace {0:s}'.format(namespace), file=headerFile)
    print('}} // namespace {0:s}'.format(namespace), file=sourceFile)

if __name__ == '__main__':
    main()
