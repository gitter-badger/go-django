package log

import (
	"testing"
	"strings"
	"log"
	"os"
)

type testByteBuffer string

func (l *testByteBuffer) Write(p []byte) (int, error) {
	os.Stdout.Write(p)
	*l = testByteBuffer(string(*l) + string(p))
	return len(p), nil
}

func TestLog(t *testing.T) {
	b := testByteBuffer("")
	log.SetOutput(&b)
	Log(VERB, "Verbose")
	if !strings.Contains(string(b), "VERB") && !strings.Contains(string(b), "Verbose") {
		t.Fail()
	}
}

func TestSetMin(t *testing.T) {
	SetMin(1)
	b := testByteBuffer("")
	log.SetOutput(&b)
	Log(VERB, "Verbose")
	if string(b) != "" {
		t.Error("minimum set to Debug but verbose logs are printing")
	}
	Log(DEBU, "Debug")
	Log(INFO, "Info")
	if !strings.Contains(string(b), "DEBU") && !strings.Contains(string(b), "INFO") {
		t.Error("minimum is set to Debug but debug or info logs are not printing")
	}
}

func TestSetMin2(t *testing.T) {
	err := SetMin(-1)
	if err == nil {
		t.Error("given wrong level but no error is returned")
	}
}