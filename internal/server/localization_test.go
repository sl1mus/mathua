package server

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/chuma-beep/mathua/internal/auth"
	"github.com/chuma-beep/mathua/internal/concepts"
	"github.com/chuma-beep/mathua/internal/engine"
	"github.com/chuma-beep/mathua/internal/generator"
	"github.com/chuma-beep/mathua/internal/generator/arithmetic"
	"github.com/chuma-beep/mathua/internal/storage"
)

func TestPracticeAdditionCarriesLocalizedPresentation(t *testing.T) {
	dag, err := concepts.Build([]concepts.Concept{{ID: "arith.add.single", Label: "Addition", Domain: "arithmetic", GradingType: "numeric", Prerequisites: []string{}, MasteryThreshold: concepts.MasteryThreshold{Streak: 3, AvgTimeSeconds: 60}}})
	if err != nil {
		t.Fatal(err)
	}
	store, err := storage.NewSQLiteStore(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	reg := generator.NewRegistry()
	arithmetic.Register(reg)
	server := New(engine.New(store, dag, reg, nil, nil), store, auth.New(store))
	mux := http.NewServeMux()
	server.Register(mux)
	token, _ := guestTokenAndID(t, mux)
	rec := authedGet(t, mux, "/api/lessons/arith.add.single/practice?count=2", token)
	if rec.Code != http.StatusOK {
		t.Fatalf("practice %d: %s", rec.Code, rec.Body.String())
	}
	var body struct {
		Questions []struct {
			Question      string                                `json:"question"`
			Answer        string                                `json:"answer"`
			Explanation   string                                `json:"explanation"`
			Localizations map[string]generator.LocalizedProblem `json:"localizations"`
		} `json:"questions"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if len(body.Questions) == 0 {
		t.Fatal("empty practice payload")
	}
	for _, q := range body.Questions {
		if q.Localizations["en"].Question != q.Question || q.Localizations["en"].Explanation != q.Explanation {
			t.Fatal("English presentation differs from final canonical problem")
		}
		if !strings.Contains(q.Localizations["ru"].Question, "Вычислите") {
			t.Fatal("Russian question missing from HTTP payload")
		}
		if q.Answer == "" || strings.Contains(q.Question, "Вычислите") {
			t.Fatal("canonical grading data was replaced by presentation")
		}
	}
}
