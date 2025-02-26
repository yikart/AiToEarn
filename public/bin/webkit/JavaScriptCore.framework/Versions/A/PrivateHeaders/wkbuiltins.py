# This file is used to simulate the wkbuiltins/ directory when generate-js-builtins.py
# is run from JavaScriptCore framework's private headers directory, which is flattened.

from builtins_model import *
from builtins_templates import *

from builtins_generator import *
from builtins_generate_combined_header import *
from builtins_generate_combined_implementation import *
from builtins_generate_separate_header import *
from builtins_generate_separate_implementation import *
from builtins_generate_wrapper_header import *
from builtins_generate_wrapper_implementation import *
from builtins_generate_internals_wrapper_header import *
from builtins_generate_internals_wrapper_implementation import *
