# Copyright (C) 2010-2017 Apple Inc. All rights reserved.
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
# THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import re

from webkit import model


def combine_condition(conditions):
    if conditions:
        if len(conditions) == 1:
            return conditions[0]
        else:
            return bracket_if_needed(' && '.join(map(bracket_if_needed, conditions)))
    else:
        return None


def bracket_if_needed(condition):
    if re.match(r'.*(&&|\|\|).*', condition):
        return '(%s)' % condition
    else:
        return condition


def parse(file):
    receiver_enabled_by = None
    receiver_enabled_by_exception = False
    receiver_enabled_by_conjunction = None
    receiver_dispatched_from = None
    receiver_dispatched_to = None
    receiver_attributes = None
    shared_preferences_needs_connection = False
    destination = None
    messages = []
    conditions = []
    master_condition = None
    superclass = []
    namespace = "WebKit"
    file_contents = file.readlines()
    match = re.search(r'\s*\[\s*(?P<extended_attributes>.*?)\s*\]\s*.*messages -> ', "".join(file_contents).replace("\n", " "), re.MULTILINE)
    if match:
        extended_attributes = re.split(r'\s*,\s*', match.group('extended_attributes'))
        for attribute in extended_attributes:
            match = re.match(r'(?P<name>\w+)\s*=\s*(?P<value>.+)', attribute)
            if match:
                if match.group('name') == 'EnabledBy':
                    (receiver_enabled_by, receiver_enabled_by_conjunction) = parse_enabled_by_string(match.group('value'))
                    continue
                if match.group('name') == 'DispatchedFrom':
                    receiver_dispatched_from = parse_process_name_string(match.group('value'))
                    continue
                if match.group('name') == 'DispatchedTo':
                    receiver_dispatched_to = parse_process_name_string(match.group('value'))
                    continue
            elif attribute == 'SharedPreferencesNeedsConnection':
                shared_preferences_needs_connection = True
                continue
            elif attribute == 'ExceptionForEnabledBy':
                receiver_enabled_by_exception = True
                continue
            raise Exception("ERROR: Unknown extended attribute: '%s'" % attribute)
    if receiver_enabled_by and receiver_enabled_by_exception:
        raise Exception("ERROR: 'ExceptionForEnabledBy' cannot be used together with 'EnabledBy=%s'" % receiver_enabled_by)
    for line in file_contents:
        line = line.strip()
        match = re.search(r'messages -> (?P<namespace>[A-Za-z]+)::(?P<destination>[A-Za-z_0-9]+) \s*(?::\s*(?P<superclass>.*?) \s*)?(?:(?P<attributes>.*?)\s+)?{', line)
        if not match:
            match = re.search(r'messages -> (?P<destination>[A-Za-z_0-9]+) \s*(?::\s*(?P<superclass>.*?) \s*)?(?:(?P<attributes>.*?)\s+)?{', line)
        else:
            if match.group('namespace'):
                namespace = match.group('namespace')
        if match:
            receiver_attributes = parse_attributes_string(match.group('attributes'))
            if match.group('superclass'):
                superclass = match.group('superclass')
                if receiver_enabled_by:
                    raise Exception("ERROR: EnabledBy is not supported for a message receiver with a superclass")
            if conditions:
                master_condition = conditions
                conditions = []
            destination = match.group('destination')
            continue
        if line.startswith('#'):
            if line.startswith('#if '):
                conditions.append(line[4:])
            elif line.startswith('#endif') and conditions:
                conditions.pop()
            elif line.startswith('#else') or line.startswith('#elif'):
                raise Exception("ERROR: '%s' is not supported in the *.in files" % line)
            continue
        match = re.search(r'(?:\[(.*)\] (?:.* )?)?([A-Za-z_0-9]+)\((.*?)\)(?:(?:\s+->\s+)\((.*?)\))?(?:\s+(.*))?', line)
        if match:
            options_string, name, parameters_string, reply_parameters_string, attributes_string = match.groups()
            if parameters_string:
                parameters = parse_parameters_string(parameters_string)
                for parameter in parameters:
                    parameter.condition = combine_condition(conditions)
            else:
                parameters = []

            validator = None
            enabled_by = None
            enabled_by_exception = False
            enabled_by_conjunction = None
            coalescing_key_indices = None
            if options_string:
                match = re.search(r"(?:(?:, |^)+(?:Validator=(.*)))(?:, |$)?", options_string)
                if match:
                    validator = match.groups()[0]
                match = re.search(r"(?:(?:, |^)+(?:EnabledBy=([\w \&\|]+)))(?:, |$)?", options_string)
                if match:
                    (enabled_by, enabled_by_conjunction) = parse_enabled_by_string(match.groups()[0])
                match = re.search(r"(?:(?:, |^)+(?:ExceptionForEnabledBy))(?:, |$)?", options_string)
                if match:
                    enabled_by_exception = True
                match = re.search(r"(?:(?:, |^)+(?:DeferSendingIfSuspended))(?:, |$)?", options_string)
                if match:
                    coalescing_key_indices = []
                match = re.search(r"(?:(?:, |^)+(?:DeferSendingIfSuspendedWithCoalescingKeys=\((.*?)\)))(?:, |$)?", options_string)
                if match:
                    coalescing_key_indices = parse_coalescing_keys(match.group(1), [parameter.name for parameter in parameters])

            if enabled_by and enabled_by_exception:
                raise Exception("ERROR: 'ExceptionForEnabledBy' cannot be used together with 'EnabledBy=%s'" % enabled_by)

            attributes = parse_attributes_string(attributes_string)

            if reply_parameters_string:
                reply_parameters = parse_parameters_string(reply_parameters_string)
                for reply_parameter in reply_parameters:
                    reply_parameter.condition = combine_condition(conditions)
            elif reply_parameters_string == '':
                reply_parameters = []
            else:
                reply_parameters = None

            if coalescing_key_indices is not None and reply_parameters is not None:
                raise Exception(f"ERROR: DeferSendingIfSuspended not supported for message {name} since it contains reply parameters")

            messages.append(model.Message(name, parameters, reply_parameters, attributes, combine_condition(conditions), validator, enabled_by, enabled_by_exception, enabled_by_conjunction, coalescing_key_indices))
    return model.MessageReceiver(destination, superclass, receiver_attributes, receiver_enabled_by, receiver_enabled_by_exception, receiver_enabled_by_conjunction, receiver_dispatched_from, receiver_dispatched_to, shared_preferences_needs_connection, messages, combine_condition(master_condition), namespace)


def parse_attributes_string(attributes_string):
    if not attributes_string:
        return None
    return attributes_string.split()


def split_parameters_string(parameters_string):
    parameters = []
    current_parameter_string = ''

    nest_level = 0
    for character in parameters_string:
        if character == ',' and nest_level == 0:
            parameters.append(current_parameter_string)
            current_parameter_string = ''
            continue

        if character == '<':
            nest_level += 1
        elif character == '>':
            nest_level -= 1

        current_parameter_string += character

    parameters.append(current_parameter_string)
    return parameters


def parse_parameters_string(parameters_string):
    parameters = []

    for parameter_string in split_parameters_string(parameters_string):
        match = re.search(r'\s*(?:\[(?P<attributes>.*?)\]\s+)?(?P<type_and_name>.*)', parameter_string)
        attributes_string, type_and_name_string = match.group('attributes', 'type_and_name')

        split = type_and_name_string.rsplit(' ', 1)
        parameter_kind = 'class'
        if split[0].startswith('struct '):
            parameter_kind = 'struct'
            split[0] = split[0][7:]
        elif split[0].startswith('enum:'):
            parameter_kind = split[0][:split[0].find(' ')]
            split[0] = split[0][split[0].find(' ') + 1:]

        if len(split) != 2:
            raise Exception("ERROR: Argument '%s' in parameter list '%s' is missing either type or name" % (type_and_name_string, parameter_string))

        parameter_type = split[0]
        parameter_name = split[1]

        parameters.append(model.Parameter(kind=parameter_kind, type=parameter_type, name=parameter_name, attributes=parse_attributes_string(attributes_string)))
    return parameters


def parse_enabled_by_string(enabled_by_string):
    enabled_by = None
    enabled_by_conjunction = None

    has_and_conjunction = '&&' in enabled_by_string
    has_or_conjunction = '||' in enabled_by_string

    if has_and_conjunction and has_or_conjunction:
        raise Exception('ERROR: EnabledBy cannot contain both && and || conjunctions')
    elif has_and_conjunction:
        enabled_by = re.split(r'\s*&&\s*', enabled_by_string)
        enabled_by_conjunction = '&&'
    elif has_or_conjunction:
        enabled_by = re.split(r'\s*\|\|\s*', enabled_by_string)
        enabled_by_conjunction = '||'
    else:
        enabled_by = [enabled_by_string.strip()]
        enabled_by_conjunction = None

    return enabled_by, enabled_by_conjunction


def parse_process_name_string(value):
    if value in ["UI", "Networking", "GPU", "WebContent", "Model"]:
        return value
    raise Exception('ERROR: Invalid Process Name found')


def parse_coalescing_keys(coalescing_keys_string, parameter_names):
    coalescing_key_names = [part.strip() for part in coalescing_keys_string.split(',')]
    return [parameter_names.index(name) for name in coalescing_key_names]
