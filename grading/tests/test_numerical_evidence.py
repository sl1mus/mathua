"""Regression checks for numerical comparisons with unusable samples."""
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch
from sympy import Symbol, sin, cos

spec = importlib.util.spec_from_file_location("service", Path(__file__).resolve().parents[1] / "sympy_service.py")
service = importlib.util.module_from_spec(spec)
spec.loader.exec_module(service)

class NumericalEvidenceTest(unittest.TestCase):
    def test_all_samples_too_large_are_not_evidence(self):
        x = Symbol("x")
        self.assertFalse(service._numerical_check(10**12 + x, 10**12 + 2*x)[0])

    def test_all_samples_undefined_are_not_evidence(self):
        x = Symbol("x")
        with patch.object(service.random, "uniform", return_value=1):
            self.assertFalse(service._numerical_check(1/(x-1), 2/(x-1))[0])

    def test_one_valid_sample_is_not_enough(self):
        x = Symbol("x")
        with patch.object(service.random, "uniform", side_effect=[1]*9 + [2]):
            self.assertFalse(service._numerical_check(1/(x-1), 1/(x-1))[0])

    def test_equivalent_functions_with_valid_samples_pass(self):
        x = Symbol("x")
        self.assertTrue(service._numerical_check(sin(x)**2 + cos(x)**2, x*0+1)[0])

    def test_different_functions_fail(self):
        x = Symbol("x")
        self.assertFalse(service._numerical_check(x, x+1)[0])

if __name__ == "__main__":
    unittest.main()
