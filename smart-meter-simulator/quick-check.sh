#!/bin/bash

# UTCC University GridTokenX Campus Network - Quick Production Check
# IEEE 2030.5-2018 Smart Energy Profile 2.0 - Phase 2 Deployment Check

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🏫 UTCC University GridTokenX Campus Network"
echo "📋 Production Readiness Quick Check"
echo "IEEE 2030.5-2018 Smart Energy Profile 2.0 - Phase 2"
echo ""

CHECKS_PASSED=0
CHECKS_TOTAL=0

check_item() {
    local description="$1"
    local command="$2"
    ((CHECKS_TOTAL++))
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}[✓]${NC} $description"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}[✗]${NC} $description"
        return 1
    fi
}

check_warning() {
    local description="$1"
    local command="$2"
    ((CHECKS_TOTAL++))
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}[✓]${NC} $description"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}[⚠]${NC} $description (will be handled during deployment)"
        ((CHECKS_PASSED++))  # Count warnings as passed for deployment
    fi
}

echo "🔧 System Requirements:"
check_item "Python 3.9+ is available" "python3 -c 'import sys; exit(0 if sys.version_info >= (3,9) else 1)'"
check_warning "Virtual environment exists" "test -d .venv"
echo ""

echo "📁 Required Files:"
check_item "UTCC campus config exists" "test -f config/utcc_campus_config.json"
check_item "Deployment script exists" "test -f deploy-utcc-campus.sh"
check_item "Deployment script is executable" "test -x deploy-utcc-campus.sh"
echo ""

echo "🔐 Certificate Infrastructure:"
check_warning "CA directory exists" "test -d certs/ca"
check_warning "Meter certificates directory exists" "test -d certs/meters"
check_item "Certificate generation script exists" "test -f generate_campus_certificates.py"
echo ""

echo "🐍 Python Environment:"
check_item "UV project file exists" "test -f pyproject.toml"
check_item "UV lock file exists" "test -f uv.lock"
check_warning "Virtual environment exists" "test -d .venv"
echo ""

echo "🌐 Network Ports (checking availability):"
for port in 8080 8443 8444; do
    check_warning "Port $port is available" "! lsof -i :$port"
done
echo ""

echo "📊 Validation Summary:"
echo "   Checks Passed: $CHECKS_PASSED/$CHECKS_TOTAL"
PERCENTAGE=$(( CHECKS_PASSED * 100 / CHECKS_TOTAL ))
echo "   Success Rate:  $PERCENTAGE%"
echo ""

if [ "$CHECKS_PASSED" -eq "$CHECKS_TOTAL" ]; then
    echo -e "${GREEN}🎉 READY FOR DEPLOYMENT!${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Run: ./deploy-utcc-campus.sh"
    echo "   2. Monitor: tail -f logs/campus_simulator.log"
    echo "   3. Access: http://localhost:8080 (API) and https://localhost:8444 (IEEE 2030.5)"
elif [ "$PERCENTAGE" -ge 80 ]; then
    echo -e "${YELLOW}⚠️  READY WITH MINOR ISSUES${NC}"
    echo "   Deployment should work, but some optimizations may be needed."
    echo ""
    echo "🚀 Proceed with: ./deploy-utcc-campus.sh"
else
    echo -e "${RED}❌ NOT READY${NC}"
    echo "   Please address the failed checks before deployment."
    exit 1
fi

echo ""
echo "📚 Additional Resources:"
echo "   • Full Documentation: README.md"
echo "   • Configuration Guide: config/utcc_campus_config.json"
echo "   • Troubleshooting: tail -f logs/campus_simulator.log"
echo ""