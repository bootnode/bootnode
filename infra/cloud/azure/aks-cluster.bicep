// Azure AKS Cluster Configuration
// Deploy with: az deployment group create --template-file aks-cluster.bicep

@description('The name of the AKS cluster')
param clusterName string = 'bootnode-cluster'

@description('The location for the cluster')
param location string = resourceGroup().location

@description('The Kubernetes version')
param kubernetesVersion string = '1.29.0'

@description('The VM size for API nodes')
param apiNodeVmSize string = 'Standard_D4s_v3'

@description('The VM size for indexer nodes')
param indexerNodeVmSize string = 'Standard_E8s_v3'

@description('The VM size for database nodes')
param dbNodeVmSize string = 'Standard_L8s_v2'

resource aksCluster 'Microsoft.ContainerService/managedClusters@2024-01-01' = {
  name: clusterName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    kubernetesVersion: kubernetesVersion
    dnsPrefix: '${clusterName}-dns'
    enableRBAC: true

    networkProfile: {
      networkPlugin: 'azure'
      networkPolicy: 'calico'
      loadBalancerSku: 'standard'
      serviceCidr: '10.0.0.0/16'
      dnsServiceIP: '10.0.0.10'
    }

    addonProfiles: {
      azurePolicy: {
        enabled: true
      }
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalyticsWorkspace.id
        }
      }
    }

    agentPoolProfiles: [
      {
        name: 'system'
        count: 2
        vmSize: 'Standard_D2s_v3'
        osType: 'Linux'
        mode: 'System'
        enableAutoScaling: true
        minCount: 2
        maxCount: 4
        osDiskSizeGB: 100
        osDiskType: 'Managed'
        type: 'VirtualMachineScaleSets'
        nodeTaints: [
          'CriticalAddonsOnly=true:NoSchedule'
        ]
      }
      {
        name: 'api'
        count: 3
        vmSize: apiNodeVmSize
        osType: 'Linux'
        mode: 'User'
        enableAutoScaling: true
        minCount: 2
        maxCount: 10
        osDiskSizeGB: 100
        osDiskType: 'Managed'
        type: 'VirtualMachineScaleSets'
        nodeLabels: {
          role: 'api'
          'nodegroup-type': 'api'
        }
      }
      {
        name: 'indexer'
        count: 2
        vmSize: indexerNodeVmSize
        osType: 'Linux'
        mode: 'User'
        enableAutoScaling: true
        minCount: 1
        maxCount: 5
        osDiskSizeGB: 500
        osDiskType: 'Managed'
        type: 'VirtualMachineScaleSets'
        nodeLabels: {
          role: 'indexer'
          'nodegroup-type': 'indexer'
        }
        nodeTaints: [
          'dedicated=indexer:NoSchedule'
        ]
      }
      {
        name: 'database'
        count: 3
        vmSize: dbNodeVmSize
        osType: 'Linux'
        mode: 'User'
        enableAutoScaling: false
        osDiskSizeGB: 200
        osDiskType: 'Managed'
        type: 'VirtualMachineScaleSets'
        nodeLabels: {
          role: 'database'
          'nodegroup-type': 'database'
        }
        nodeTaints: [
          'dedicated=database:NoSchedule'
        ]
      }
    ]
  }
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${clusterName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

output clusterName string = aksCluster.name
output controlPlaneFQDN string = aksCluster.properties.fqdn
output kubeletIdentityObjectId string = aksCluster.properties.identityProfile.kubeletidentity.objectId
