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

# This script generates JS, Objective C, and C++ bindings for the inspector protocol.
# Generators for individual files are located in the codegen/ directory.

import os
import re
import sys
import string
from string import Template
import optparse
import logging
import subprocess

try:
    import json
except ImportError:
    import simplejson as json

logging.basicConfig(format='%(levelname)s: %(message)s', level=logging.ERROR)
log = logging.getLogger('global')

try:
    from codegen import *

# When copying generator files to JavaScriptCore's private headers on Mac,
# the codegen/ module directory is flattened. So, import directly.
except ImportError as e:
    #log.error(e) # Uncomment this to debug early import errors.
    import models
    from models import *
    from generator import *
    from cpp_generator import *
    from objc_generator import *

    from generate_cpp_alternate_backend_dispatcher_header import *
    from generate_cpp_backend_dispatcher_header import *
    from generate_cpp_backend_dispatcher_implementation import *
    from generate_cpp_frontend_dispatcher_header import *
    from generate_cpp_frontend_dispatcher_implementation import *
    from generate_cpp_protocol_types_header import *
    from generate_cpp_protocol_types_implementation import *
    from generate_js_backend_commands import *
    from generate_objc_backend_dispatcher_header import *
    from generate_objc_backend_dispatcher_implementation import *
    from generate_objc_configuration_header import *
    from generate_objc_configuration_implementation import *
    from generate_objc_frontend_dispatcher_implementation import *
    from generate_objc_header import *
    from generate_objc_internal_header import *
    from generate_objc_protocol_type_conversions_header import *
    from generate_objc_protocol_type_conversions_implementation import *
    from generate_objc_protocol_types_implementation import *


# A writer that only updates file if it actually changed.
class IncrementalFileWriter:
    def __init__(self, filepath, force_output):
        self._filepath = filepath
        self._output = ""
        self.force_output = force_output

    def write(self, text):
        self._output += text

    def close(self):
        text_changed = True
        self._output = self._output.rstrip() + "\n"

        try:
            if self.force_output:
                raise

            read_file = open(self._filepath, "r")
            old_text = read_file.read()
            read_file.close()
            text_changed = old_text != self._output
        except:
            # Ignore, just overwrite by default
            pass

        if text_changed or self.force_output:
            dirname = os.path.dirname(self._filepath)
            if not os.path.isdir(dirname):
                os.makedirs(dirname)
            out_file = open(self._filepath, "w")
            out_file.write(self._output)
            out_file.close()


def generate_from_specification(primary_specification_filepath=None,
                                supplemental_specification_filepaths=[],
                                concatenate_output=False,
                                output_dirpath=None,
                                force_output=False,
                                framework_name="",
                                generate_frontend=True,
                                generate_backend=True):

    def load_specification(protocol, filepath, isSupplemental=False):
        try:
            with open(filepath, "r") as input_file:
                regex = re.compile(r"\/\*.*?\*\/", re.DOTALL)
                parsed_json = json.loads(re.sub(regex, "", input_file.read()))
                protocol.parse_specification(parsed_json, isSupplemental)
        except ValueError as e:
            raise Exception("Error parsing valid JSON in file: " + filepath + "\nParse error: " + str(e))

    protocol = models.Protocol(framework_name)
    for specification in supplemental_specification_filepaths:
        load_specification(protocol, specification, isSupplemental=True)
    load_specification(protocol, primary_specification_filepath, isSupplemental=False)

    protocol.resolve_types()

    generator_arguments = [protocol, primary_specification_filepath]
    generators = []

    if protocol.framework is Frameworks.Test:
        generators.append(JSBackendCommandsGenerator(*generator_arguments))
        generators.append(CppAlternateBackendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(CppBackendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(CppBackendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(CppFrontendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(CppFrontendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(CppProtocolTypesHeaderGenerator(*generator_arguments))
        generators.append(CppProtocolTypesImplementationGenerator(*generator_arguments))
        generators.append(ObjCBackendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(ObjCBackendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(ObjCConfigurationHeaderGenerator(*generator_arguments))
        generators.append(ObjCConfigurationImplementationGenerator(*generator_arguments))
        generators.append(ObjCFrontendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(ObjCHeaderGenerator(*generator_arguments))
        generators.append(ObjCInternalHeaderGenerator(*generator_arguments))
        generators.append(ObjCProtocolTypeConversionsHeaderGenerator(*generator_arguments))
        generators.append(ObjCProtocolTypeConversionsImplementationGenerator(*generator_arguments))
        generators.append(ObjCProtocolTypesImplementationGenerator(*generator_arguments))

    elif protocol.framework is Frameworks.JavaScriptCore:
        generators.append(JSBackendCommandsGenerator(*generator_arguments))
        generators.append(CppAlternateBackendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(CppBackendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(CppBackendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(CppFrontendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(CppFrontendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(CppProtocolTypesHeaderGenerator(*generator_arguments))
        generators.append(CppProtocolTypesImplementationGenerator(*generator_arguments))

    elif protocol.framework is Frameworks.WebKit and generate_backend:
        generators.append(CppBackendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(CppBackendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(CppFrontendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(CppFrontendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(CppProtocolTypesHeaderGenerator(*generator_arguments))
        generators.append(CppProtocolTypesImplementationGenerator(*generator_arguments))

    elif protocol.framework is Frameworks.WebKit and generate_frontend:
        generators.append(ObjCHeaderGenerator(*generator_arguments))
        generators.append(ObjCProtocolTypeConversionsHeaderGenerator(*generator_arguments))
        generators.append(ObjCProtocolTypeConversionsImplementationGenerator(*generator_arguments))
        generators.append(ObjCProtocolTypesImplementationGenerator(*generator_arguments))

    elif protocol.framework is Frameworks.WebInspector:
        generators.append(ObjCBackendDispatcherHeaderGenerator(*generator_arguments))
        generators.append(ObjCBackendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(ObjCConfigurationHeaderGenerator(*generator_arguments))
        generators.append(ObjCConfigurationImplementationGenerator(*generator_arguments))
        generators.append(ObjCFrontendDispatcherImplementationGenerator(*generator_arguments))
        generators.append(ObjCHeaderGenerator(*generator_arguments))
        generators.append(ObjCInternalHeaderGenerator(*generator_arguments))
        generators.append(ObjCProtocolTypeConversionsHeaderGenerator(*generator_arguments))
        generators.append(ObjCProtocolTypesImplementationGenerator(*generator_arguments))

    elif protocol.framework is Frameworks.WebInspectorUI:
        generators.append(JSBackendCommandsGenerator(*generator_arguments))

    single_output_file_contents = []

    for generator in generators:
        # Only some generators care whether frontend or backend was specified, but it is
        # set on all of them to avoid adding more constructor arguments or thinking too hard.
        if generate_backend:
            generator.set_generator_setting('generate_backend', True)
        if generate_frontend:
            generator.set_generator_setting('generate_frontend', True)

        output = generator.generate_output()

        output_filename = generator.output_filename()
        output_filepath = os.path.join(output_dirpath, output_filename)

        if generator.needs_preprocess():
            temporary_input_filename = output_filename + ".in"
            temporary_input_filepath = os.path.join(output_dirpath, temporary_input_filename)

            temporary_output_filename = output_filename + ".out"
            temporary_output_filepath = os.path.join(output_dirpath, temporary_output_filename)

            if concatenate_output:
                single_output_file_contents.append('### Begin File: %s' % temporary_input_filename)
                single_output_file_contents.append(output)
                single_output_file_contents.append('### End File: %s' % temporary_input_filename)
                single_output_file_contents.append('')

            temporary_input_file = open(temporary_input_filepath, "w")
            temporary_input_file.write(output)
            temporary_input_file.close()

            subprocess.check_call(["perl", os.path.join(os.path.dirname(__file__), "codegen", "preprocess.pl"), "--input", temporary_input_filepath, "--defines", protocol.condition_flags, "--output", temporary_output_filepath])

            temporary_output_file = open(temporary_output_filepath, "r")
            output = temporary_output_file.read()
            temporary_output_file.close()

            if concatenate_output:
                single_output_file_contents.append('### Begin File: %s' % temporary_output_filename)
                single_output_file_contents.append(output)
                single_output_file_contents.append('### End File: %s' % temporary_output_filename)
                single_output_file_contents.append('')

            os.remove(temporary_input_filepath)
            os.remove(temporary_output_filepath)
        elif concatenate_output:
            single_output_file_contents.append('### Begin File: %s' % output_filename)
            single_output_file_contents.append(output)
            single_output_file_contents.append('### End File: %s' % output_filename)
            single_output_file_contents.append('')

        if not concatenate_output:
            output_file = IncrementalFileWriter(output_filepath, force_output)
            output_file.write(output)
            output_file.close()

    if concatenate_output:
        filename = os.path.join(os.path.basename(primary_specification_filepath) + '-result')
        output_file = IncrementalFileWriter(os.path.join(output_dirpath, filename), force_output)
        output_file.write('\n'.join(single_output_file_contents))
        output_file.close()


if __name__ == '__main__':
    allowed_framework_names = ['JavaScriptCore', 'WebInspector', 'WebInspectorUI', 'WebKit', 'Test']
    cli_parser = optparse.OptionParser(usage="usage: %prog [options] PrimaryProtocol.json [SupplementalProtocol.json ...]")
    cli_parser.add_option("-o", "--outputDir", help="Directory where generated files should be written.")
    cli_parser.add_option("--framework", type="choice", choices=allowed_framework_names, help="The framework that the primary specification belongs to.")
    cli_parser.add_option("--force", action="store_true", help="Force output of generated scripts, even if nothing changed.")
    cli_parser.add_option("-v", "--debug", action="store_true", help="Log extra output for debugging the generator itself.")
    cli_parser.add_option("-t", "--test", action="store_true", help="Enable test mode. Use unique output filenames created by prepending the input filename.")
    cli_parser.add_option("--frontend", action="store_true", help="Generate code for the frontend-side of the protocol only.")
    cli_parser.add_option("--backend", action="store_true", help="Generate code for the backend-side of the protocol only.")
    options = None

    arg_options, arg_values = cli_parser.parse_args()
    if (len(arg_values) < 1):
        raise ParseException("At least one plain argument expected")

    if not arg_options.outputDir:
        raise ParseException("Missing output directory")

    if arg_options.debug:
        log.setLevel(logging.DEBUG)

    generate_backend = arg_options.backend;
    generate_frontend = arg_options.frontend;
    # Default to generating both the frontend and backend if neither is specified.
    if not generate_backend and not generate_frontend:
        generate_backend = True
        generate_frontend = True

    options = {
        'primary_specification_filepath': arg_values[0],
        'supplemental_specification_filepaths': arg_values[1:],
        'output_dirpath': arg_options.outputDir,
        'concatenate_output': arg_options.test,
        'framework_name': arg_options.framework,
        'force_output': arg_options.force,
        'generate_backend': generate_backend,
        'generate_frontend': generate_frontend,
    }

    try:
        generate_from_specification(**options)
    except (ParseException, TypecheckException) as e:
        if arg_options.test:
            log.error(str(e))
        else:
            raise  # Force the build to fail.
