package arithmetic

import (
	"fmt"
	"github.com/chuma-beep/mathua/internal/generator"
	"strconv"
	"strings"
	"testing"
)

func TestAdditionTranslationsKeepCanonicalProblem(t *testing.T) {
	for _, g := range []*addGen{
		{minA: 1, maxA: 9, minB: 1, maxB: 9},
		{minA: 10, maxA: 99, minB: 10, maxB: 99},
		{minA: 10, maxA: 99, minB: 10, maxB: 99, ensureCarry: true},
		{minA: 100, maxA: 999, minB: 100, maxB: 999},
	} {
		for i := 0; i < 20; i++ {
			p := g.Generate(generator.GeneratorContext{Difficulty: 0.6})
			a, _ := strconv.Atoi(p.Facts["a"])
			b, _ := strconv.Atoi(p.Facts["b"])
			if p.Answer != strconv.Itoa(a+b) {
				t.Fatal("translation changed mathematical answer")
			}
			if p.Localizations["en"].Question != p.Question || p.Localizations["en"].Explanation != p.Explanation {
				t.Fatal("English no longer matches canonical instance")
			}
			ru := p.Localizations["ru"]
			if !strings.Contains(ru.Question, fmt.Sprintf("%d + %d", a, b)) || !strings.Contains(ru.Explanation, fmt.Sprintf("%d + %d = %d", a, b, a+b)) {
				t.Fatalf("translation lost operands or sum: %+v", ru)
			}
			if !strings.Contains(ru.Question, "Вычислите") {
				t.Fatal("missing Russian statement")
			}
		}
	}
}
