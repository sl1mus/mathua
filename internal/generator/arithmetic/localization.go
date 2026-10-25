package arithmetic

import (
	"fmt"
	"github.com/chuma-beep/mathua/internal/generator"
)

// additionLocalizations renders the same operands without drawing another problem.
// Question stays canonical for grading anchors, repetition and mastery evidence.
func additionLocalizations(p generator.Problem) generator.Problem {
	a, b, sum := p.Facts["a"], p.Facts["b"], p.Facts["sum"]
	p.Localizations = map[string]generator.LocalizedProblem{
		"en": {Question: p.Question, Explanation: p.Explanation},
		"ru": {
			Question:    fmt.Sprintf("Вычислите: \\(%s + %s = ?\\)", a, b),
			Explanation: fmt.Sprintf("Сложим %s и %s: \\(%s + %s = %s\\). Ответ: %s.", a, b, a, b, sum, sum),
		},
	}
	return p
}
