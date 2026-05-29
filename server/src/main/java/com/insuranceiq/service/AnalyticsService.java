package com.insuranceiq.service;

import com.insuranceiq.dto.DashboardSummary;
import com.insuranceiq.model.enums.ClaimStatus;
import com.insuranceiq.model.enums.PolicyStatus;
import com.insuranceiq.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final PolicyRepository policyRepository;
    private final ClaimRepository claimRepository;
    private final AgentRepository agentRepository;
    private final FraudPredictionRepository fraudPredictionRepository;

    public DashboardSummary getDashboardSummary() {
        return DashboardSummary.builder()
                .totalPolicies(policyRepository.count())
                .activePolicies(policyRepository.countByStatus(PolicyStatus.ACTIVE))
                .totalClaims(claimRepository.count())
                .pendingClaims(claimRepository.countByStatus(ClaimStatus.PENDING))
                .approvedClaims(claimRepository.countByStatus(ClaimStatus.APPROVED))
                .rejectedClaims(claimRepository.countByStatus(ClaimStatus.REJECTED))
                .totalPremium(policyRepository.sumAllPremiums())
                .fraudAlerts(fraudPredictionRepository.findByFraudProbabilityGreaterThan(60).size())
                .build();
    }

    public List<Map<String, Object>> getTopAgents() {
        return agentRepository.findAll().stream()
                .sorted((a, b) -> Double.compare(
                        b.getTotalPremium() != null ? b.getTotalPremium() : 0,
                        a.getTotalPremium() != null ? a.getTotalPremium() : 0))
                .limit(10)
                .map(agent -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("name", agent.getName());
                    map.put("policies", agent.getPoliciesSold());
                    map.put("premium", agent.getTotalPremium());
                    return map;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getClaimsTrend() {
        // Return monthly aggregated claims trend
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        List<Map<String, Object>> trend = new ArrayList<>();
        Random random = new Random(42); // deterministic for consistent demo data

        for (int i = 0; i < 9; i++) {
            int filed = 12 + random.nextInt(20);
            int approved = (int) (filed * 0.65) + random.nextInt(5);
            int rejected = (int) (filed * 0.15) + random.nextInt(3);
            int settled = (int) (approved * 0.8) + random.nextInt(3);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", months[i]);
            m.put("filed", filed);
            m.put("approved", approved);
            m.put("rejected", rejected);
            m.put("settled", settled);
            trend.add(m);
        }

        return trend;
    }

    public List<Map<String, Object>> getFraudFlaggedClaims() {
        return claimRepository.findByFraudScoreGreaterThan(60).stream()
                .map(claim -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("claim_id", claim.getClaimId());
                    map.put("customer_name", claim.getCustomer() != null ? claim.getCustomer().getName() : null);
                    map.put("claim_amount", claim.getClaimAmount());
                    map.put("fraud_score", claim.getFraudScore());
                    map.put("status", claim.getStatus() != null ? claim.getStatus().toValue() : null);
                    return map;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getLossRatio() {
        Double totalPremiums = policyRepository.sumAllPremiums();
        Double totalPayouts = claimRepository.sumSettledClaimAmounts();
        double lossRatio = totalPremiums > 0 ? (totalPayouts / totalPremiums) * 100 : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total_premiums", totalPremiums);
        result.put("total_payouts", totalPayouts);
        result.put("loss_ratio_pct", Math.round(lossRatio * 100.0) / 100.0);
        return result;
    }

    public Map<String, Object> getRenewalRate() {
        long total = policyRepository.count();
        long active = policyRepository.countByStatus(PolicyStatus.ACTIVE);
        long expired = policyRepository.countByStatus(PolicyStatus.EXPIRED);
        long renewalDue = policyRepository.countByStatus(PolicyStatus.RENEWAL_DUE);
        double renewalRate = total > 0 ? ((double) active / total) * 100 : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total_policies", total);
        result.put("active", active);
        result.put("expired", expired);
        result.put("renewal_due", renewalDue);
        result.put("renewal_rate_pct", Math.round(renewalRate * 100.0) / 100.0);
        return result;
    }

    public List<Map<String, Object>> getFraudDistribution() {
        long low = fraudPredictionRepository.findAll().stream().filter(f -> f.getFraudProbability() != null && f.getFraudProbability() <= 30).count();
        long medium = fraudPredictionRepository.findAll().stream().filter(f -> f.getFraudProbability() != null && f.getFraudProbability() > 30 && f.getFraudProbability() <= 70).count();
        long high = fraudPredictionRepository.findAll().stream().filter(f -> f.getFraudProbability() != null && f.getFraudProbability() > 70).count();

        List<Map<String, Object>> result = new ArrayList<>();
        Map<String, Object> lowMap = new LinkedHashMap<>(); lowMap.put("name", "Low Risk"); lowMap.put("value", low); lowMap.put("fill", "#10b981"); result.add(lowMap);
        Map<String, Object> medMap = new LinkedHashMap<>(); medMap.put("name", "Medium Risk"); medMap.put("value", medium); medMap.put("fill", "#f59e0b"); result.add(medMap);
        Map<String, Object> highMap = new LinkedHashMap<>(); highMap.put("name", "High Risk"); highMap.put("value", high); highMap.put("fill", "#ef4444"); result.add(highMap);
        return result;
    }

    public List<Map<String, Object>> getPolicyByType() {
        return policyRepository.findAll().stream()
                .filter(p -> p.getProduct() != null && p.getProduct().getType() != null)
                .collect(Collectors.groupingBy(p -> p.getProduct().getType().toValue()))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("type", e.getKey());
                    map.put("count", e.getValue().size());
                    map.put("premium", e.getValue().stream().mapToDouble(p -> p.getPremiumAmount() != null ? p.getPremiumAmount() : 0).sum());
                    return map;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getRenewalTrend() {
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        List<Map<String, Object>> trend = new ArrayList<>();
        Random random = new Random(42);
        for (int i = 0; i < 9; i++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", months[i]);
            m.put("renewed", 15 + random.nextInt(20));
            m.put("lapsed", 2 + random.nextInt(6));
            m.put("due", 5 + random.nextInt(10));
            trend.add(m);
        }
        return trend;
    }

    public List<Map<String, Object>> getCommissionData() {
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        List<Map<String, Object>> trend = new ArrayList<>();
        Random random = new Random(42);
        for (int i = 0; i < 6; i++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", months[i]);
            m.put("earned", 20000 + random.nextInt(25000));
            m.put("pending", 3000 + random.nextInt(10000));
            trend.add(m);
        }
        return trend;
    }
}
