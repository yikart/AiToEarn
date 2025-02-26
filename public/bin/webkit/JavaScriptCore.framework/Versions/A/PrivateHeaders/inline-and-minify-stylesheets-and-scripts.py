#!/usr/bin/env python3
#
# Copyright (C) 2013 Apple Inc. All rights reserved.
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

# This script inlines and minifies external stylesheets and scripts.
#  - <link href="..." rel="stylesheet"> => <style>...</style>
#  - <script src="...">                 => <script>...</script>

import cssmin
import jsmin
import os.path
import re
import sys


def main(argv):

    if len(argv) < 2:
        print('usage: %s inputFile outputFile' % argv[0])
        return 1

    inputFileName = argv[1]
    outputFileName = argv[2]
    importsDir = os.path.dirname(inputFileName)

    inputFile = open(inputFileName, 'r')
    inputContent = inputFile.read()
    inputFile.close()

    def inline(match, minifier, prefix, postfix):
        importFileName = match.group(1)
        fullPath = os.path.join(importsDir, importFileName)
        if not os.access(fullPath, os.F_OK):
            raise Exception('File %s referenced in %s not found' % (importFileName, inputFileName))
        importFile = open(fullPath, 'r')
        importContent = minifier(importFile.read())
        importFile.close()
        return '%s%s%s' % (prefix, importContent, postfix)

    def inlineStylesheet(match):
        return inline(match, cssmin.cssminify, "<style>", "</style>")

    def inlineScript(match):
        return inline(match, jsmin.jsmin, "<script>", "</script>")

    outputContent = re.sub(r'<link rel="stylesheet" href=[\'"]([^\'"]+)[\'"]>', inlineStylesheet, inputContent)
    outputContent = re.sub(r'<script src=[\'"]([^\'"]+)[\'"]></script>', inlineScript, outputContent)

    outputFile = open(outputFileName, 'w')
    outputFile.write(outputContent)
    outputFile.close()

    # Touch output file directory to make sure that Xcode will copy
    # modified resource files.
    if sys.platform == 'darwin':
        outputDirName = os.path.dirname(outputFileName)
        os.utime(outputDirName, None)

if __name__ == '__main__':
    sys.exit(main(sys.argv))
